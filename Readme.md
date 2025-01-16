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

Create Kubernetes files.

run kubernetes manifests:
```bash
kubectl apply -f <manifests_folder>
```

verify deployments:
```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

delete deployments:
```bash
kubectl delete -f <manifests_folder>
```

Create docker images and push them to your dockerhub (run from the microservice folder):
```bash
docker build -t pesekt1/bank-service .
docker build -t pesekt1/consumer-service .
```

Push images to dockerhub:
```bash
docker push pesekt1/bank-service
docker push pesekt1/consumer-service

```

run kubernetes manifests:
```bash
kubectl apply -f ./kubernetes
```