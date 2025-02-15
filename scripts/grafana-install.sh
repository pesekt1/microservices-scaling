#!/bin/bash

set -e  # Exit immediately if any command fails

echo "🚀 Installing Grafana using Helm..."

# Step 1: Check if Helm is installed
if ! command -v helm &> /dev/null
then
    echo "⚠️ Helm not found! Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
    echo "✅ Helm is already installed."
fi

# Step 2: Add Grafana Helm repository
echo "🔄 Adding Grafana Helm repository..."
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Step 3: Install Grafana with persistence
echo "📦 Installing Grafana with persistent storage..."
helm install grafana grafana/grafana \
  --set service.type=NodePort \
  --set service.nodePort=30001 \
  --set persistence.enabled=true \
  --set persistence.size=2Gi \
  --set persistence.storageClassName=hostpath \
  --set adminPassword='admin'


# Step 4: Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
kubectl wait --for=condition=available deployment/grafana --timeout=120s

# Step 5: Retrieve Admin Password
echo "🔑 Retrieving Grafana admin password..."
GRAFANA_PASSWORD=$(kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode)

echo "✅ Grafana installed successfully!"
echo "🌐 Access Grafana at: http://localhost:30001"
echo "👤 Username: admin"
echo "🔑 Password: $GRAFANA_PASSWORD"
