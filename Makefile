.PHONY: help up down logs restart install test k8s-deploy k8s-delete clean \
       dev full monitor backup restore verify-backup lint setup \
       verify-image inspect-sbom

# Default target
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@findstr /R /C:"^[a-zA-Z0-9_-]*:.*##" $(MAKEFILE_LIST) | awk -F':.*##' '{ printf "  %-15s %s\n", $$1, $$2 }' || awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Setup ─────────────────────────────────────────────────────────────────────
setup: ## First-time setup: install root dev dependencies (husky, commitlint)
	npm install
	@echo "✔ Pre-commit hooks and commitlint installed."

# ── Docker Compose — Profiles ────────────────────────────────────────────────
dev: ## Start app layer only (frontend + backend + mongodb)
	docker compose up -d consistium backend mongodb

up: ## Start the entire stack using Docker Compose (app + monitoring)
	docker compose --profile full up -d

full: up ## Alias for 'up' — start everything

monitor: ## Start monitoring stack only (prometheus, grafana, loki, etc.)
	docker compose --profile monitoring up -d

down: ## Stop and remove the Docker Compose stack
	docker compose --profile full down

restart: ## Restart the Docker Compose stack
	docker compose --profile full restart

logs: ## Follow logs of the entire stack (tail last 50 lines)
	docker compose --profile full logs -f --tail=50

clean: ## Stop the stack and remove persistent volumes (WARNING: Deletes database data)
	docker compose --profile full down -v --remove-orphans

# ── MongoDB Backup & Restore ─────────────────────────────────────────────────
backup: ## Backup MongoDB database to ./backups/
	docker compose --profile backup run --rm backup

restore: ## Restore MongoDB from a backup (interactive)
	docker compose run --rm -v ./backup:/scripts:ro mongo:6 bash /scripts/restore.sh

verify-backup: ## Verify the latest backup by restoring to a temp container
	bash backup/verify-backup.sh

# ── Backend Development ──────────────────────────────────────────────────────
install: ## Install backend npm dependencies
	cd backend && npm install

test: ## Run backend unit tests
	cd backend && npm test

# ── Local Linting ────────────────────────────────────────────────────────────
lint: ## Run all linters locally (HTML, Dockerfile)
	@echo "── Linting HTML ──"
	npx htmlhint "*.html" || true
	@echo ""
	@echo "── Linting Dockerfile (frontend) ──"
	docker run --rm -i hadolint/hadolint < Dockerfile || true
	@echo ""
	@echo "── Linting Dockerfile (backend) ──"
	docker run --rm -i hadolint/hadolint < backend/Dockerfile || true

# ── Kubernetes/Helm ──────────────────────────────────────────────────────────
k8s-deploy: ## Deploy to Kubernetes using Helm
	helm upgrade --install consistium ./helm/consistium \
	  -f helm/environments/prod.yaml \
	  -n consistium-prod --create-namespace

k8s-delete: ## Uninstall the Kubernetes Helm release
	helm uninstall consistium -n consistium-prod
	kubectl delete namespace consistium-prod --ignore-not-found

# ── Image Signing & Verification ─────────────────────────────────────────────
IMAGE ?= ghcr.io/kalpanapramodya97/consistium/habit-tracker:latest

verify-image: ## Verify Cosign signature on a Docker image (IMAGE=ghcr.io/...)
	@echo "── Verifying Cosign signature for $(IMAGE) ──"
	cosign verify \
	  --certificate-identity-regexp="https://github.com/Kalpanapramodya97/consistium/" \
	  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
	  $(IMAGE)
	@echo ""
	@echo "✔ Image signature is valid and trusted."

inspect-sbom: ## Inspect the SBOM attestation attached to a Docker image (IMAGE=ghcr.io/...)
	@echo "── Inspecting SBOM attestation for $(IMAGE) ──"
	cosign verify-attestation \
	  --type cyclonedx \
	  --certificate-identity-regexp="https://github.com/Kalpanapramodya97/consistium/" \
	  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
	  $(IMAGE) | jq -r '.payload' | base64 -d | jq '.predicate'
