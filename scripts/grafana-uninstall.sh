# Step 3: Uninstall existing Grafana release if present
if helm list --filter '^grafana$' | grep grafana &> /dev/null; then
    echo "🧹 Uninstalling existing Grafana release..."
    helm uninstall grafana
fi