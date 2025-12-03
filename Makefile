SHELL := /bin/bash

# Makefile for managing the bank-service and Kubernetes environment

# .phony is used to declare targets that are not files, preventing conflicts with files of the same name
.PHONY: help up down skaffold bank logs open keda-install grafana-install clean-bank

up: bank install-dependencies skaffold ## Start bank-service and Kubernetes environment

install-dependencies: ## Install all dependencies (KEDA, Grafana, metrics-server)
	$(MAKE) keda-install
	$(MAKE) grafana-install
	$(MAKE) metrics-server-install

skaffold: ## Run skaffold live dev loop
	$(MAKE) keda-install
	$(MAKE) grafana-install
	skaffold dev
	$(MAKE) open

bank: ## Build and start the external bank-service
	@echo "🟦 Building bank-service image..."
	docker build -t bank-service:latest ./bank

	@echo "🟥 Removing old bank-service container if it exists..."
	- docker rm -f bank-service

	@echo "🟩 Starting bank-service container..."
	docker run -d --name bank-service --network host \
		-e PORT=3002 \
		-e MESSAGE_SPEED=1000 \
		-e API_URL=http://localhost:32000/transactions \
		bank-service:latest

down: ## Stop bank-service and delete Kubernetes resources
	@echo "🟥 Removing bank-service container..."
	- docker rm -f bank-service

	@echo "🟥 Cleaning Skaffold resources (PVC 'grafana' will be preserved)..."
	skaffold delete

logs: ## Tail logs for a service (usage: make logs app=name)
	kubectl logs -l app=$(app) -f

open: ## Open browser tabs for UIs
	bash ./scripts/open-chrome.sh

grafana-install: ## Install Grafana if not present
	"$(CURDIR)/scripts/grafana-install.sh"

keda-install: ## Install KEDA operator if not present
	"$(CURDIR)/scripts/keda-install.sh"

metrics-server-install: ## Install metrics-server if not present
	bash ./scripts/metrics-server-install.sh

help: ## Show this help menu
	@echo ""
	@echo "Available commands:"
	@echo "-------------------"
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | sed 's/:.*##/:  /' | column -t -s ':'
	@echo ""
