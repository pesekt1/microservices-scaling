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

## Scaling with Kubernetes:
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

### Scaling


### RabbitMQ Exporter
We need this to expose RabbitMQ metrics to Prometheus.

Port forward RabbitMQ Exporter:
```bash
kubectl port-forward svc/rabbitmq-exporter 9419:9419
```

Open RabbitMQ Exporter in your browser: http://localhost:9419.
You can go to metrics: http://localhost:9419/metrics

### Working with Prometheus:

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


## Prometheus adapter
To autoscale with Kubernetes, we need prometheus adapter. 

Create the Horizontal Pod Autoscaler (HPA)




## This part is not finished: 



We can install it using helm.

First, install helm:
(on windows)
in powershell as admin:
```bash
choco install kubernetes-helm
```

Add the Prometheus Community Repository to Helm
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

Update the Helm Repositories:
```bash
helm repo update
```

Install prometheus adapter:
```bash
helm install prometheus-adapter prometheus-community/prometheus-adapter --set prometheus.url=http://prometheus:9090
```

create values.yaml file for prometheus adapter and upgrade the adapter:
```bash
helm upgrade --install prometheus-adapter prometheus-community/prometheus-adapter -f values.yaml
```

you can list metrics:
```bash
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1
```


if you make changes, you can upgrade the adapter without installing:
```bash
helm upgrade prometheus-adapter prometheus-community/prometheus-adapter -f values.yaml
```



Install metrics server:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Verify metrics server installation:
```bash
kubectl get deployment metrics-server -n kube-system
```