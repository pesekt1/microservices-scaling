# Microservices demo with RabbitMQ message broker.

## Tech stack:
- Typescript
- Node.js
- Express.js
- RabbitMQ
- Docker
- Docker-compose
- MySQL

## Instructions:

### How to run:
```bash
docker-compose up --build -d
```
### How to stop:
```bash
docker-compose down
```

### How to scale a service running in docker-compose:
```bash
docker-compose up --scale service_name=3
```

## Scaling in docker-compose:
Limitations:
- you cannot define a service name in the docker-compose file
- you cannot define a port mapping for the scaled service
- you cannot set the scale in the docker-compose file, you have to do it in the command line
- you cannot set the auto scaling rules in the docker-compose file

## Kubernetes:
The proper way to scale microservices is to use an orchestration tool like Kubernetes. Kubernetes is a container orchestration tool that automates the deployment, scaling, and management of containerized applications. 

Kubernetes needs a container registry to pull images from.

Create docker images and push them to your dockerhub (run from each microservice folder):
```bash
docker build -t pesekt1/bank-microservice .
docker build -t pesekt1/consumer-microservice .
```

Push images to dockerhub:
```bash
docker push pesekt1/bank-microservice
docker push pesekt1/consumer-microservice

```

Create Kubernetes files.

run kubernetes manifests (in kubernetes folder):
```bash
kubectl apply -f ./kubernetes
```

verify deployments:
```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

delete deployments (in kubernetes folder):
```bash
kubectl delete -f ./kubernetes
```

### MySQL in Kubernetes
You can access it via MySQL Workbench.
user: root
password: root

### RabbitMQ in Kubernetes
You can access it on: http://localhost:30008/

### RabbitMQ Exporter
We need this to expose RabbitMQ metrics to Prometheus.

Port forward RabbitMQ Exporter:
```bash
kubectl port-forward svc/rabbitmq-exporter 9419:9419
```

Open RabbitMQ Exporter in your browser: http://localhost:9419.
You can go to metrics: http://localhost:9419/metrics

### Prometheus:

Check that Prometheus is running:
```bash
kubectl get pods
```

Port forward Prometheus:
```bash
kubectl port-forward svc/prometheus 9090:9090
```

Open Prometheus in your browser: http://localhost:9090.

Search for RabbitMQ metrics (e.g., rabbitmq_queue_messages_ready).

### Scaling in Kubernetes

#### KEDA
You can install and use KEDA by applying the KEDA manifests directly using kubectl. Here are the steps to install KEDA and configure it to use Prometheus metrics for scaling your deployment.

```bash
kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.16.1/keda-2.16.1.yaml
```

Create a KEDA ScaledObject for the deployment:

```yml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: consumer-microservice-scaledobject
  namespace: default
spec:
  scaleTargetRef:
    name: consumer-microservice
  minReplicaCount: 1
  maxReplicaCount: 10
  pollingInterval: 30  # Polling interval in seconds
  cooldownPeriod: 60  # Cooldown period in seconds
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.default.svc.cluster.local:9090
      metricName: rabbitmq_queue_messages
      query: avg(rabbitmq_queue_messages{queue="bankPackets"})
      threshold: '20'
```

NOTE: KEDA uses a default pollingInterval 30sec and cooldownPeriod 60sec, that is why there is a delay before it starts scaling up or down.

Now the consumer microservice is scaled based on the rules defined in the scaleobject.yaml.
We can observe the results in RabbitMQ – we can see the number of consumers, consumed messages, messages in the queue, etc.
 