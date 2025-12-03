# Ensure PVC exists before installing Grafana
PVC_MANIFEST="$(dirname "$0")/grafana/grafana-pvc.yaml"
kubectl apply -f "$PVC_MANIFEST"
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



# Step 3: Check if Grafana is already installed
if helm list --filter '^grafana$' | grep grafana &> /dev/null; then
    echo "ℹ️ Grafana Helm release exists. Checking pod health..."
    POD_COUNT=$(kubectl get pod -l app.kubernetes.io/instance=grafana --no-headers | wc -l)
    if [ "$POD_COUNT" -eq 0 ]; then
        echo "⚠️ No Grafana pods found. Attempting to reinstall Grafana..."
        helm uninstall grafana || true
        echo "📦 Installing Grafana with persistent storage..."
        helm install grafana grafana/grafana \
            --set service.type=NodePort \
            --set service.nodePort=30001 \
            --set persistence.enabled=true \
            --set persistence.size=2Gi \
            --set persistence.storageClassName=hostpath \
            --set adminPassword='admin' \
            --set initChownData.enabled=false
        echo "⏳ Waiting for Grafana to be ready..."
        kubectl wait --for=condition=available deployment/grafana --timeout=120s
        POD_COUNT=$(kubectl get pod -l app.kubernetes.io/instance=grafana --no-headers | wc -l)
        if [ "$POD_COUNT" -eq 0 ]; then
            echo "❌ No Grafana pods found after install."
        else
            POD_STATUS=$(kubectl get pod -l app.kubernetes.io/instance=grafana -o jsonpath='{.items[0].status.phase}')
            if [ "$POD_STATUS" = "Running" ]; then
                echo "✅ Grafana pod is running."
                echo "🔑 Retrieving Grafana admin password..."
                GRAFANA_PASSWORD=$(kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode)
                echo "✅ Grafana installed successfully!"
                echo "🌐 Access Grafana at: http://localhost:30001"
                echo "👤 Username: admin"
                echo "🔑 Password: $GRAFANA_PASSWORD"
            else
                echo "⚠️ Grafana pod is not running (status: $POD_STATUS)."
                echo "🔍 Checking recent events for troubleshooting:"
                kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20
                echo "🔍 Checking pod logs:"
                kubectl logs -l app.kubernetes.io/instance=grafana --tail=20
            fi
        fi
    else
        POD_STATUS=$(kubectl get pod -l app.kubernetes.io/instance=grafana -o jsonpath='{.items[0].status.phase}')
        if [ "$POD_STATUS" = "Running" ]; then
            echo "✅ Grafana pod is running. Skipping installation."
        else
            echo "⚠️ Grafana pod is not running (status: $POD_STATUS). Reinstalling Grafana..."
            helm uninstall grafana
            echo "📦 Installing Grafana with persistent storage..."
            helm install grafana grafana/grafana \
                --set service.type=NodePort \
                --set service.nodePort=30001 \
                --set persistence.enabled=true \
                --set persistence.size=2Gi \
                --set persistence.storageClassName=hostpath \
                --set adminPassword='admin' \
                --set initChownData.enabled=false
            echo "⏳ Waiting for Grafana to be ready..."
            kubectl wait --for=condition=available deployment/grafana --timeout=120s
            POD_COUNT=$(kubectl get pod -l app.kubernetes.io/instance=grafana --no-headers | wc -l)
            if [ "$POD_COUNT" -eq 0 ]; then
                echo "⚠️ No Grafana pods found after install."
            else
                POD_STATUS=$(kubectl get pod -l app.kubernetes.io/instance=grafana -o jsonpath='{.items[0].status.phase}')
                if [ "$POD_STATUS" = "Running" ]; then
                    echo "✅ Grafana pod is running."
                    echo "🔑 Retrieving Grafana admin password..."
                    GRAFANA_PASSWORD=$(kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode)
                    echo "✅ Grafana installed successfully!"
                    echo "🌐 Access Grafana at: http://localhost:30001"
                    echo "👤 Username: admin"
                    echo "🔑 Password: $GRAFANA_PASSWORD"
                else
                    echo "⚠️ Grafana pod is not running (status: $POD_STATUS)."
                    echo "🔍 Checking recent events for troubleshooting:"
                    kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20
                    echo "🔍 Checking pod logs:"
                    kubectl logs -l app.kubernetes.io/instance=grafana --tail=20
                fi
            fi
        fi
    fi
else
    # Step 4: Install Grafana with persistence
    echo "📦 Installing Grafana with persistent storage..."
    helm install grafana grafana/grafana \
        --set service.type=NodePort \
        --set service.nodePort=30001 \
        --set persistence.enabled=true \
        --set persistence.size=2Gi \
        --set persistence.storageClassName=hostpath \
        --set adminPassword='admin' \
        --set initChownData.enabled=false
    echo "⏳ Waiting for Grafana to be ready..."
    kubectl wait --for=condition=available deployment/grafana --timeout=120s
    POD_STATUS=$(kubectl get pod -l app.kubernetes.io/instance=grafana -o jsonpath='{.items[0].status.phase}')
    if [ "$POD_STATUS" = "Running" ]; then
        echo "✅ Grafana pod is running."
        echo "🔑 Retrieving Grafana admin password..."
        GRAFANA_PASSWORD=$(kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode)
        echo "✅ Grafana installed successfully!"
        echo "🌐 Access Grafana at: http://localhost:30001"
        echo "👤 Username: admin"
        echo "🔑 Password: $GRAFANA_PASSWORD"
    else
        echo "⚠️ Grafana pod is not running (status: $POD_STATUS)."
        echo "🔍 Checking recent events for troubleshooting:"
        kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20
        echo "🔍 Checking pod logs:"
        kubectl logs -l app.kubernetes.io/instance=grafana --tail=20
    fi
fi
