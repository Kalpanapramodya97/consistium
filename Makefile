.PHONY: help up down logs restart install test k8s-deploy k8s-delete clean

# Default target
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@findstr /R /C:"^[a-zA-Z0-9_-]*:.*##" $(MAKEFILE_LIST) | awk -F':.*##' '{ printf "  %-15s %s\n", $$1, $$2 }' || awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Compose Targets
up: ## Start the entire stack using Docker Compose
	docker compose up -d

down: ## Stop and remove the Docker Compose stack
	docker compose down

restart: ## Restart the Docker Compose stack
	docker compose restart

logs: ## Follow the logs of the Docker Compose stack
	docker compose logs -f

clean: ## Stop the stack and remove persistent volumes (WARNING: Deletes database data)
	docker compose down -v

# Backend Development Targets
install: ## Install backend npm dependencies
	cd backend && npm install

test: ## Run backend unit tests
	cd backend && npm test

# Kubernetes/Helm Targets
k8s-deploy: ## Deploy to Kubernetes using Helm
	helm upgrade --install consistium ./helm/consistium \
	  -f helm/environments/prod.yaml \
	  -n consistium-prod --create-namespace

k8s-delete: ## Uninstall the Kubernetes Helm release
	helm uninstall consistium -n consistium-prod
	kubectl delete namespace consistium-prod --ignore-not-found
