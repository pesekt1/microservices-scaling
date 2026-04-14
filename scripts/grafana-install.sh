#!/usr/bin/env bash
set -euo pipefail

PVC_MANIFEST="$(dirname "$0")/grafana/grafana-pvc.yaml"
kubectl apply -f "$PVC_MANIFEST" >/dev/null

# Fast path: if Grafana is already up, don’t touch Helm repos (avoids slow timeouts)
if kubectl get deployment grafana >/dev/null 2>&1; then
  AVAILABLE="$(kubectl get deployment grafana -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || true)"
  if [[ "$AVAILABLE" == "True" ]]; then
    echo "✅ Grafana deployment is available. Skipping installation."
    exit 0
  fi
fi

echo "🚀 Installing Grafana using Helm..."

# Step 1: Check if Helm is installed
if ! command -v helm &> /dev/null; then
  echo "⚠️ Helm not found! Installing Helm..."
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
  echo "✅ Helm is already installed."
fi

# Step 2: Add Grafana Helm repository (don’t fail if network is flaky)
echo "🔄 Adding Grafana Helm repository..."
helm repo add grafana https://grafana.github.io/helm-charts >/dev/null 2>&1 || true

# Keep this short to avoid hanging startup on Windows networks/VPNs
if ! helm repo update --timeout 30s; then
  echo "⚠️ Helm repo update timed out; continuing."
fi

# Step 3: Install/upgrade Grafana with persistence
echo "📦 Installing/Upgrading Grafana with persistent storage..."
helm upgrade --install grafana grafana/grafana \
  --set service.type=NodePort \
  --set service.nodePort=30001 \
  --set persistence.enabled=true \
  --set persistence.size=2Gi \
  --set persistence.storageClassName=hostpath \
  --set adminPassword='admin' \
  --set initChownData.enabled=false

echo "⏳ Waiting for Grafana to be ready..."
kubectl wait --for=condition=available deployment/grafana --timeout=120s

echo "✅ Grafana is ready at: http://localhost:30001"