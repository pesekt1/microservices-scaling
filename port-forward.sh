#!/bin/bash

# Port forward RabbitMQ exporter in detached mode
kubectl port-forward svc/rabbitmq-exporter 9419:9419

# Port forward Prometheus in detached mode
kubectl port-forward svc/prometheus 9090:9090

