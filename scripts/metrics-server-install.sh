#!/bin/bash

set -e

METRICS_SERVER_MANIFEST="$(dirname "$0")/../kubernetes/metrics-server/components.yaml"
NAMESPACE="kube-system"

# New manifest location
METRICS_SERVER_MANIFEST="$(dirname "$0")/metrics-server/components.yaml"

# Check if metrics-server pod is running
POD_STATUS=$(kubectl get pods -n $NAMESPACE -l k8s-app=metrics-server -o jsonpath='{.items[0].status.phase}' 2>/dev/null || echo "NotFound")

if [ "$POD_STATUS" = "Running" ]; then
    echo "✅ metrics-server is already running in $NAMESPACE."
else
    echo "⚠️ metrics-server not running. Installing..."
    kubectl apply -f "$METRICS_SERVER_MANIFEST"
    echo "⏳ Waiting for metrics-server to be ready..."
    kubectl wait --for=condition=available deployment/metrics-server -n $NAMESPACE --timeout=120s
    echo "✅ metrics-server installed and running."
fi
