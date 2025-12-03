#!/bin/bash

set -e  # Exit immediately if any command fails

KEDA_YAML="https://github.com/kedacore/keda/releases/download/v2.16.1/keda-2.16.1.yaml"
KEDA_NAMESPACE="keda"
KEDA_DEPLOYMENT="keda-operator"

# Check if KEDA operator is already installed and available
if kubectl get deployment "$KEDA_DEPLOYMENT" -n "$KEDA_NAMESPACE" &> /dev/null; then
    AVAILABLE=$(kubectl get deployment "$KEDA_DEPLOYMENT" -n "$KEDA_NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')
    if [ "$AVAILABLE" == "True" ]; then
        echo "✅ KEDA is already installed and available. Skipping installation."
        exit 0
    else
        echo "⚠️ KEDA operator found but not available. Waiting..."
        kubectl wait --for=condition=available --timeout=600s deployment/$KEDA_DEPLOYMENT -n $KEDA_NAMESPACE
        exit 0
    fi
else
    echo "⚠️ KEDA is not installed. Installing KEDA..."
    kubectl apply --server-side -f "$KEDA_YAML"
    echo "⏳ Waiting for KEDA operator to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/$KEDA_DEPLOYMENT -n $KEDA_NAMESPACE
    echo "✅ KEDA installed successfully."
fi
