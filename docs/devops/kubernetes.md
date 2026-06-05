# Kubernetes Deployment Guide

Consistium can be deployed to any Kubernetes cluster using the included Helm chart. The chart provides a production-grade deployment with security hardening, autoscaling, monitoring integration, and multi-environment support.

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| [Helm](https://helm.sh/docs/intro/install/) | v3.12+ | Kubernetes package manager |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | v1.27+ | Kubernetes CLI |
| Kubernetes cluster | v1.27+ | Target environment (EKS, GKE, AKS, minikube, kind) |

### Optional Components

| Component | Purpose |
|---|---|
| [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/) | External traffic routing |
| [cert-manager](https://cert-manager.io/) | Automatic TLS certificate provisioning |
| [Prometheus Operator](https://prometheus-operator.dev/) | ServiceMonitor auto-discovery |

---

## Quick Start

### Deploy to Development

```bash
# Add/update dependencies (if any)
cd helm/consistium

# Deploy with dev overrides
helm install consistium . \
  -f ../environments/dev.yaml \
  -n consistium --create-namespace

# Verify
kubectl get pods -n consistium
kubectl get svc -n consistium
```

### Access the Application

```bash
# Port-forward for local access
kubectl port-forward svc/consistium 3000:80 -n consistium

# Open in browser
# http://localhost:3000
```

---

## Multi-Environment Deployment

The chart supports three pre-configured environments with progressive resource allocation and security hardening.

### Environment Comparison

| Feature | Dev | Staging | Production |
|---|---|---|---|
| Replicas | 1 | 2 | 3 |
| HPA | ✗ | 2–5 pods | 3–10 pods |
| PDB | ✗ | minAvailable: 1 | minAvailable: 2 |
| Network Policy | ✗ | ✓ | ✓ |
| TLS | ✗ | ✓ | ✓ (HSTS) |
| ServiceMonitor | ✗ | ✓ | ✓ (10s interval) |
| Pod Anti-Affinity | Preferred | Preferred | **Required** |
| CPU Limit | 100m | 200m | 250m |
| Memory Limit | 32Mi | 48Mi | 64Mi |

### Deploy Commands

```bash
# Development
helm install consistium ./helm/consistium \
  -f helm/environments/dev.yaml \
  -n consistium-dev --create-namespace

# Staging
helm install consistium ./helm/consistium \
  -f helm/environments/staging.yaml \
  -n consistium-staging --create-namespace

# Production
helm install consistium ./helm/consistium \
  -f helm/environments/prod.yaml \
  -n consistium-prod --create-namespace
```

### Upgrade an Existing Release

```bash
helm upgrade consistium ./helm/consistium \
  -f helm/environments/prod.yaml \
  -n consistium-prod
```

### Rollback

```bash
# List revision history
helm history consistium -n consistium-prod

# Rollback to previous revision
helm rollback consistium 1 -n consistium-prod
```

---

## Chart Structure

```
helm/
├── consistium/
│   ├── Chart.yaml              # Chart metadata
│   ├── values.yaml             # Default values
│   └── templates/
│       ├── _helpers.tpl        # Template helpers (labels, names)
│       ├── configmap.yaml      # Nginx configuration
│       ├── deployment.yaml     # Application deployment
│       ├── hpa.yaml            # Horizontal Pod Autoscaler
│       ├── ingress.yaml        # Ingress with TLS
│       ├── networkpolicy.yaml  # Zero-trust network policy
│       ├── NOTES.txt           # Post-install instructions
│       ├── pdb.yaml            # Pod Disruption Budget
│       ├── service.yaml        # ClusterIP service
│       ├── serviceaccount.yaml # Dedicated service account
│       └── servicemonitor.yaml # Prometheus Operator CRD
└── environments/
    ├── dev.yaml                # Development overrides
    ├── staging.yaml            # Staging overrides
    └── prod.yaml               # Production overrides
```

---

## Security Hardening

The chart implements defense-in-depth across multiple layers:

### Pod Security

| Control | Implementation |
|---|---|
| Non-root execution | `runAsUser: 101` (nginx user) |
| Read-only filesystem | `readOnlyRootFilesystem: true` + emptyDir volumes for temp |
| No privilege escalation | `allowPrivilegeEscalation: false` |
| Drop all capabilities | `capabilities.drop: [ALL]` |
| Seccomp profile | `RuntimeDefault` |
| Service account | Dedicated, non-default service account |

### Network Security

| Control | Implementation |
|---|---|
| Network Policy | Ingress: only from ingress-nginx and monitoring namespaces |
| | Egress: DNS only (port 53) |
| Ingress annotations | Rate limiting (50 rps), connection limiting (20), body size cap (1m) |
| TLS | cert-manager with Let's Encrypt, HSTS in production |

### Nginx Hardening

| Control | Implementation |
|---|---|
| Server tokens | Hidden (`server_tokens off`) |
| Security headers | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, CSP, Referrer-Policy |
| Stub status | Restricted to private IP ranges only |
| Hidden files | Denied (`location ~ /\.`) |

---

## Autoscaling Behavior

The HPA uses v2 API with advanced scaling policies to prevent flapping:

```
Scale Up:    +2 pods per 60s, 30s stabilization window
Scale Down:  -1 pod per 60s (prod: per 120s), 300s stabilization window
```

This means:
- **Fast scale-up**: Responds to traffic spikes within 30 seconds
- **Slow scale-down**: Waits 5 minutes of sustained low usage before removing pods
- **Gradual**: Adds 2 pods at a time, removes only 1 at a time

---

## Monitoring Integration

When the Prometheus Operator is installed, the ServiceMonitor CRD automatically registers the Consistium pods as scrape targets.

```bash
# Verify ServiceMonitor is created
kubectl get servicemonitors -n consistium

# Check Prometheus targets
# Navigate to Prometheus UI → Status → Targets
```

### Key Metrics Available

| Metric | Description |
|---|---|
| `nginx_connections_active` | Currently active connections |
| `nginx_connections_accepted` | Total accepted connections |
| `nginx_connections_handled` | Total handled connections |
| `nginx_http_requests_total` | Total HTTP requests served |
| `nginx_connections_reading` | Connections reading request headers |
| `nginx_connections_writing` | Connections writing responses |
| `nginx_connections_waiting` | Idle keep-alive connections |

---

## Values Reference

### Top-Level Parameters

| Parameter | Default | Description |
|---|---|---|
| `replicaCount` | `2` | Number of pod replicas (ignored when HPA is enabled) |
| `image.repository` | `ghcr.io/kalpanapramodya97/consistium/habit-tracker` | Container image repository |
| `image.tag` | `""` (uses Chart appVersion) | Container image tag |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy |

### Ingress Parameters

| Parameter | Default | Description |
|---|---|---|
| `ingress.enabled` | `true` | Enable Ingress resource |
| `ingress.className` | `nginx` | Ingress class name |
| `ingress.hosts[0].host` | `consistium.local` | Hostname |
| `ingress.tls[0].secretName` | `consistium-tls` | TLS secret name |

### Autoscaling Parameters

| Parameter | Default | Description |
|---|---|---|
| `autoscaling.enabled` | `true` | Enable HPA |
| `autoscaling.minReplicas` | `2` | Minimum replicas |
| `autoscaling.maxReplicas` | `10` | Maximum replicas |
| `autoscaling.targetCPUUtilizationPercentage` | `70` | CPU target for scaling |
| `autoscaling.targetMemoryUtilizationPercentage` | `80` | Memory target for scaling |

### Resource Parameters

| Parameter | Default | Description |
|---|---|---|
| `resources.limits.cpu` | `250m` | CPU limit |
| `resources.limits.memory` | `64Mi` | Memory limit |
| `resources.requests.cpu` | `50m` | CPU request |
| `resources.requests.memory` | `16Mi` | Memory request |

---

## Troubleshooting

### Pods stuck in CrashLoopBackOff

```bash
# Check pod events
kubectl describe pod -l app.kubernetes.io/name=consistium -n consistium

# Check logs
kubectl logs -l app.kubernetes.io/name=consistium -n consistium --previous
```

Most common cause: read-only filesystem issues. Ensure the emptyDir volumes for `/tmp`, `/var/cache/nginx`, and `/var/run` are properly mounted.

### Ingress not routing traffic

```bash
# Verify Ingress resource
kubectl get ingress -n consistium -o wide

# Check ingress controller logs
kubectl logs -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx
```

### HPA not scaling

```bash
# Check metrics server is running
kubectl get pods -n kube-system | grep metrics-server

# Verify HPA status
kubectl get hpa -n consistium -o wide
kubectl describe hpa consistium -n consistium
```
