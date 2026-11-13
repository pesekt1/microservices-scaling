# Microservices Demo with RabbitMQ Message Broker

![System Architecture](./diagrams/system-architecture.png)
[Download the full architecture diagram (.drawio)](./documentation/microservices-scaling.drawio)

This project simulates a system for processing banking messages, similar to those used in financial institutions like Deutsche Börse. The architecture demonstrates how microservices communicate via RabbitMQ, process transactions, and integrate monitoring and scaling tools for a production-like environment.

## Architecture

### Services and message flow

```
bank ──HTTP──▶ transaction-receiver ──▶ [transactionPayloads] ──▶ fraud-detection
                                                                     │
                                  ┌──────────────────────────────────┤
                                  ▼                                  ▼
                       [acceptedTransactions]            [suspiciousTransactions]
                                  │
                                  ▼
                       transaction-processing ──▶ MySQL
```

| Service                  | Role                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `bank`                   | Simulates a bank generating transactions and sending them to the receiver.                                  |
| `transaction-receiver`   | HTTP entry point. Publishes incoming transactions to the `transactionPayloads` queue.                       |
| `fraud-detection`        | Consumes `transactionPayloads`; flags ~5% as suspicious (`suspiciousTransactions`), the rest go to `acceptedTransactions`. |
| `transaction-processing` | Consumes `acceptedTransactions` and stores the transactions in MySQL.                                       |
| RabbitMQ                 | Message broker connecting the services.                                                                     |
| MySQL                    | Persistent storage for processed transactions.                                                              |

### Deployment diagrams

Docker Compose:

![Docker Compose deployment](./diagrams/docker-compose.png)

Kubernetes:

![Kubernetes deployment](./diagrams/kubernetes.png)

---

## Requirements

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Kubernetes enabled in Docker Desktop, or a local cluster (e.g., minikube)
- Make
- Skaffold

---

## Prerequisites: Installing Make and Skaffold (Windows)

Before using the automated setup, ensure you have the following tools installed:

### Make (Windows)

- Install via Chocolatey:
  ```bash
  choco install make
  ```

### Skaffold (Windows)

- Install via Chocolatey:
  ```bash
  choco install skaffold
  ```

---

For Mac and Linux instructions, see:

- [Make documentation](https://www.gnu.org/software/make/)
- [Skaffold installation guide](https://skaffold.dev/docs/install/)

---

## Project Overview

A demo microservices system using Node.js, RabbitMQ, Docker, and Kubernetes. Includes monitoring, scaling, and automation tools.

## Quick Start (Recommended)

Use the automated Makefile and Skaffold setup for a robust, production-like environment.

### Start the stack

Use bash terminal or Git Bash on Windows to run the following command:

```bash
make up
```

Installs global dependencies and deploys all microservices and supporting resources via Skaffold.

### Stop the stack

```bash
make down
```

Cleans up microservices and global resources.

### Install dependencies only

```bash
make install-dependencies
```

Installs Grafana, KEDA, metrics-server, and other global services.

### Accessing Services

After deployment, you can access the following services:

| Service           | URL / Port             | Username | Password |
| ----------------- | ---------------------- | -------- | -------- |
| Grafana           | http://localhost:30001 | admin    | admin    |
| Prometheus        | http://localhost:9090  | -        | -        |
| RabbitMQ          | http://localhost:30008 | guest    | guest    |
| RabbitMQ Exporter | http://localhost:9419  | -        | -        |
| MySQL             | (via MySQL Workbench)  | root     | root     |

> Note: If you use port-forwarding, ensure the relevant commands are running (see Quick Start and Extra Info sections).

---

## Setup Options

### 1. Docker Compose

Simple local development and manual scaling.

- Start:
  ```bash
  docker-compose up --build -d
  ```
- Stop:
  ```bash
  docker-compose down
  ```
- Scale a service:
  ```bash
  docker-compose up --scale service_name=3 -d
  ```

#### Limitations

- No auto-scaling or advanced orchestration
- Manual scaling only
- Scaled replicas cannot publish fixed host ports (only one container can bind a given host port)

### 2. Legacy Kubernetes Script

Automated deployment using the kubernetes-deployment.sh script. This script applies all manifests, manages port forwarding, and runs the bank service outside Kubernetes.

- Deploy everything:
  ```bash
  bash kubernetes-deployment.sh
  ```
- Delete all deployments and stop port forwarding:
  ```bash
  bash kubernetes-deployment.sh --delete
  ```

### 3. Automated Makefile + Skaffold (Best Practice)

Central orchestration and automated deployment with persistent global services.

- See Quick Start above for workflow.
- Skaffold applies all manifests in the `kubernetes` folder and subfolders, including logging (Loki, Promtail), microservices, and infrastructure.
- Global services (Grafana, KEDA, metrics-server) managed outside Skaffold for persistence.

---

## Uninstall & Cleanup

To fully remove all resources and clean up your environment, use the appropriate method below:

### Makefile + Skaffold (Recommended)

```bash
make down
```

Removes all microservices, global dependencies, and cleans up Kubernetes resources.

### Legacy Kubernetes Script

```bash
bash kubernetes-deployment.sh --delete
```

Deletes all deployments, stops port forwarding, and removes the bank-service Docker container.

### Docker Compose

```bash
docker-compose down
```

Stops and removes all containers defined in docker-compose.

---

## Service Scaling

### Docker Compose

Manual scaling only. See above for commands and limitations.

### Kubernetes

Auto-scaling with KEDA. The ScaledObjects live next to each service in the `kubernetes` folder:

| Service                  | Trigger                                                         | Replicas |
| ------------------------ | --------------------------------------------------------------- | -------- |
| `fraud-detection`        | Prometheus: `rabbitmq_queue_messages` of `transactionPayloads` (threshold 20)    | 1–10     |
| `transaction-processing` | Prometheus: `rabbitmq_queue_messages` of `acceptedTransactions` (threshold 20)   | 1–10     |
| `transaction-receiver`   | CPU utilization                                                 | 1–3      |

Example ScaledObject (`kubernetes/fraud-detection/fraud-detection-scaledobject.yml`):

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: fraud-detection-scaledobject
spec:
  scaleTargetRef:
    name: fraud-detection
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.default.svc.cluster.local:9090
        metricName: rabbitmq_queue_messages
        query: avg(rabbitmq_queue_messages{queue="transactionPayloads"})
        threshold: "20"
```

---

## Global Dependencies & Monitoring

- **Grafana**: Persistent dashboards, runs in default namespace.
- **KEDA**: Event-driven scaling, runs in default namespace.
- **metrics-server**: Cluster metrics, runs in kube-system namespace.
- **Prometheus, Loki, Promtail**: Monitoring and log aggregation, deployed via Skaffold.

---

## Troubleshooting & Tips

- Use `kubectl get pods`, `kubectl get deployments`, and `kubectl get services` to verify resources.
- Check logs with `kubectl logs <pod>`.
- Port-forward services for local access (see above for commands).
- Remove dangling Docker images:
  ```bash
  docker images -f "dangling=true" -q | xargs docker rmi
  ```

### Common Issues & Solutions

**PVC stuck in Pending**

- Cause: StorageClass mismatch or missing.
- Solution: Run `kubectl get storageclass` and ensure your PVC uses an existing StorageClass.

**Pod CrashLoopBackOff**

- Cause: Application error, missing config, or resource limits.
- Solution: Run `kubectl logs <pod>` and `kubectl describe pod <pod>` to view errors.

**Port conflicts**

- Cause: Another process is using the port.
- Solution: Change the port in your manifest or stop the conflicting process.

**Metrics not available (Prometheus, metrics-server)**

- Cause: Service not running or port-forwarding missing.
- Solution: Check pod status and ensure port-forwarding is active.

**Service not accessible**

- Cause: Pod not running, port-forwarding missing, or firewall blocking.
- Solution: Verify pod status, port-forwarding, and local firewall settings.

**How to check events for a resource**

- Run:
  ```bash
  kubectl describe pod <pod>
  kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20
  ```

---

## Tech Stack

- Typescript
- Node.js
- Express.js
- RabbitMQ
- Docker
- Docker-compose
- MySQL
- Kubernetes, Skaffold, Make
- KEDA (event-driven autoscaling)
- Prometheus, Grafana, Loki, Promtail (monitoring and logging)
- Vitest (integration and system tests)
- GitHub Actions (CI/CD)

---

## Testing

The `transaction-receiver` has two test suites in `transaction-receiver/tests`:

- **Integration test** (`integration.test.ts`): receiver + RabbitMQ only.
- **System test** (`system.test.ts`): receiver + RabbitMQ + the `fraud-detection` service. A transaction published by the receiver must end up in `acceptedTransactions` or `suspiciousTransactions`.

Run locally (RabbitMQ must be running, e.g. `docker-compose -f docker-compose-rabbitmq.yaml up -d`; the system test also needs `fraud-detection` running):

```bash
cd transaction-receiver
npm install
npx vitest run integration.test.ts
cd tests && npx vitest run system.test.ts
```

Notes:

- The receiver reads `RABBITMQ_URL` and `QUEUE_NAME` from `.env` via dotenv, which only loads from the current working directory. When running from another directory (e.g. `tests/` in CI), pass them as environment variables.
- The shared logger writes to `/var/log/<service-name>`. Make sure that directory exists and is writable when running outside Docker.

---

## CI/CD

Each service has a GitHub Actions workflow in `.github/workflows`:

| Workflow                           | What it does                                                    |
| ---------------------------------- | --------------------------------------------------------------- |
| `ci-cd-bank.yaml`                  | Builds and pushes `pesekt1/bank`                                |
| `ci-cd-transaction-receiver.yaml`  | Integration tests, system tests, then builds and pushes the image |
| `ci-cd-fraud-detection.yaml`       | Builds and pushes `pesekt1/fraud-detection`                     |
| `ci-cd-transaction-processing.yaml`| Builds and pushes `pesekt1/transaction-processing`              |

- Triggered on pushes to `main` that change the service folder or the workflow file itself, or manually (`workflow_dispatch`).
- Requires the repository secrets `DOCKER_USERNAME` and `DOCKER_PASSWORD`.
- In the system-test job, RabbitMQ is a service container with a health check. `fraud-detection` is started afterwards with `docker run` on the same network, and the job waits until it responds before running the tests. This avoids a startup race between the services.

---

## Repository Structure

| Folder                      | Content                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `bank`, `transaction-receiver`, `fraud-detection`, `transaction-processing` | Microservice source code and Dockerfiles |
| `kubernetes`                | Manifests applied by Skaffold (services, KEDA, monitoring)   |
| `scripts`, `dependencies`   | Install scripts for global services (Grafana, KEDA, metrics-server) |
| `docker-compose-config-yaml`| Loki/Promtail configs used by Docker Compose                 |
| `diagrams`, `documentation` | Architecture diagrams                                        |
| `unused-kubernetes`         | Older manifests kept for reference, not deployed             |

---

## Extra Info: Kubernetes Setup and Usage

### Building and Pushing Images

Kubernetes needs a container registry to pull images from.

Create docker images and push them to your dockerhub:

```bash
docker build -t pesekt1/bank ./bank
docker build -t pesekt1/transaction-receiver ./transaction-receiver
docker build -t pesekt1/fraud-detection ./fraud-detection
docker build -t pesekt1/transaction-processing ./transaction-processing
```

Push images to dockerhub:

```bash
docker push pesekt1/bank
docker push pesekt1/transaction-receiver
docker push pesekt1/fraud-detection
docker push pesekt1/transaction-processing
```

The CI/CD workflows (see above) do this automatically on pushes to `main`.

### Applying Kubernetes Manifests

Run all manifests in the kubernetes folder:

```bash
kubectl apply -f ./kubernetes
```

### Verifying Deployments

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

### Deleting Deployments

```bash
kubectl delete -f ./kubernetes
```

### MySQL in Kubernetes

You can access it via MySQL Workbench.

- user: root
- password: root

### RabbitMQ in Kubernetes

Access at: http://localhost:30008/

### RabbitMQ Exporter

Expose RabbitMQ metrics to Prometheus.
Port forward RabbitMQ Exporter:

```bash
kubectl port-forward svc/rabbitmq-exporter 9419:9419
```

Open RabbitMQ Exporter in your browser: http://localhost:9419
Metrics: http://localhost:9419/metrics

### Prometheus

Check that Prometheus is running:

```bash
kubectl get pods
```

Port forward Prometheus:

```bash
kubectl port-forward svc/prometheus 9090:9090
```

Open Prometheus in your browser: http://localhost:9090
Search for RabbitMQ metrics (e.g., rabbitmq_queue_messages_ready)

### Scaling in Kubernetes

KEDA uses a default pollingInterval 30sec and cooldownPeriod 60sec, so there is a delay before scaling up or down. The microservices are scaled based on the rules defined in their `*-scaledobject.yml` files (see Service Scaling above). You can observe results in RabbitMQ (number of consumers, consumed messages, messages in the queue, etc).

---
