#!/bin/bash

#################################
# Kubernetes Deployment Script  #
# Script to deploy all Kubernetes configurations and start port forwarding for RabbitMQ-exporter and Prometheus services.
# Script also deploys the bank service as a Docker container outside of Kubernetes cluster.
#################################

# Run:
# bash kubernetes-deployment.sh

# To delete all deployments and port forwarding processes, run:
# bash kubernetes-deployment.sh --delete

###############################

# Function to wait for a pod to be ready
wait_for_pod() {
  local label=$1
  echo "Waiting for pod with label $label to be ready..."
  kubectl wait --for=condition=ready pod -l $label --timeout=600s
}

# Function to kill port forwarding processes
kill_port_forwarding() {
  if [ -f port_forward_pids.txt ]; then
    while read -r pid; do
      echo "Killing port forwarding process with PID $pid..."
      kill $pid
    done < port_forward_pids.txt
    rm port_forward_pids.txt
  fi
}

# Check for the --delete argument
if [ "$1" == "--delete" ]; then
  echo "Killing any existing port forwarding processes..."
  kill_port_forwarding
  echo "Deleting all existing deployments..."
  kubectl delete -R -f kubernetes/
  echo "Stopping the bank service Docker container..."
  docker stop bank-service
  docker rm bank-service
  echo "All deployments deleted."
  exit 0
fi

# Check if KEDA is installed
if ! kubectl get namespace keda &> /dev/null; then
  echo "KEDA is not installed. Installing KEDA..."
  kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.16.1/keda-2.16.1.yaml

  # Wait for KEDA to be ready
  echo "Waiting for KEDA to be ready..."
  kubectl wait --for=condition=available --timeout=600s deployment/keda-operator -n keda
else
  echo "KEDA is already installed."
fi

# Apply all Kubernetes configurations from the directory recursively
echo "Applying Kubernetes configurations..."
kubectl apply -R -f kubernetes/

# Wait for the RabbitMQ exporter service pod to be ready
wait_for_pod "app=rabbitmq-exporter"

# Start port forwarding for RabbitMQ-exporter
kubectl port-forward svc/rabbitmq-exporter 9419:9419 > /dev/null 2>&1 &
RABBITMQ_EXPORTER_PORT_FORWARD_PID=$!
echo $RABBITMQ_EXPORTER_PORT_FORWARD_PID >> port_forward_pids.txt
echo "Port forwarding for rabbitMQ-exporter-service set up on port 9419."

# Wait for the Prometheus service pod to be ready
wait_for_pod "app=prometheus"

# Start port forwarding for Prometheus
kubectl port-forward svc/prometheus 9090:9090 > /dev/null 2>&1 &
PROMETHEUS_PORT_FORWARD_PID=$!
echo $PROMETHEUS_PORT_FORWARD_PID >> port_forward_pids.txt
echo "Port forwarding for prometheus-service set up on port 9090."

# Check if the bank service Docker image has been updated
echo "Checking if the bank service Docker image has been updated..."
LOCAL_IMAGE_ID=$(docker images -q pesekt1/bank:latest)
REMOTE_IMAGE_ID=$(docker inspect --format='{{.Id}}' pesekt1/bank:latest)

if [ "$LOCAL_IMAGE_ID" != "$REMOTE_IMAGE_ID" ]; then
  echo "Pulling the latest Docker image for the bank service..."
  docker pull pesekt1/bank:latest
else
  echo "The bank service Docker image is up to date."
fi

# Run the bank service as a Docker container with host network mode
echo "Starting the bank service Docker container..."
docker run -d --name bank-service --network host \
  -e PORT=3002 \
  -e MESSAGE_SPEED=1000 \
  -e API_URL=http://localhost:32000/transactions \
  pesekt1/bank:latest

# Detach the script to keep port forwarding running
disown