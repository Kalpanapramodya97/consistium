# Consistium — Infrastructure as Code (Terraform)

Production-grade AWS infrastructure provisioning for the Consistium Habit Tracker using Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Account                            │
│                                                                 │
│  ┌───────────────────── VPC (10.x.0.0/16) ───────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────────┐       ┌───────────────────────────┐ │ │
│  │  │  Public Subnets  │       │     Private Subnets       │ │ │
│  │  │                  │       │                           │ │ │
│  │  │  ┌────────────┐  │       │  ┌─────────────────────┐ │ │ │
│  │  │  │    ALB     │  │       │  │    EKS Cluster       │ │ │ │
│  │  │  │ (Ingress)  │──┼───────┼─▶│  ┌───────────────┐  │ │ │ │
│  │  │  └────────────┘  │       │  │  │  Consistium    │  │ │ │ │
│  │  │                  │       │  │  │  (Helm Chart)  │  │ │ │ │
│  │  │  ┌────────────┐  │       │  │  └───────┬───────┘  │ │ │ │
│  │  │  │    NAT     │  │       │  │          │          │ │ │ │
│  │  │  │  Gateway   │  │       │  │  ┌───────▼───────┐  │ │ │ │
│  │  │  └────────────┘  │       │  │  │  Node Group   │  │ │ │ │
│  │  │                  │       │  │  │ (t3.medium+)  │  │ │ │ │
│  │  │  ┌────────────┐  │       │  │  └───────────────┘  │ │ │ │
│  │  │  │  Internet  │  │       │  └─────────────────────┘ │ │ │
│  │  │  │  Gateway   │  │       │                           │ │ │
│  │  │  └────────────┘  │       │  ┌─────────────────────┐ │ │ │
│  │  └──────────────────┘       │  │   DocumentDB        │ │ │ │
│  │                             │  │   (MongoDB compat.)  │ │ │ │
│  │                             │  │   TLS + Encrypted    │ │ │ │
│  │                             │  └─────────────────────┘ │ │ │
│  │                             └───────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Observability ──────────┐  ┌─ Security ──────────────────┐ │
│  │ CloudWatch Logs          │  │ KMS (EKS secret encryption) │ │
│  │ VPC Flow Logs            │  │ Security Groups (least priv)│ │
│  │ EKS Control Plane Logs   │  │ IRSA (pod-level IAM)        │ │
│  │ DocumentDB Audit Logs    │  │ Private subnets (no public) │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
terraform/
├── main.tf                          # Root module — orchestrates all child modules
├── variables.tf                     # Input variables with validations
├── outputs.tf                       # Output values (endpoints, instructions)
├── versions.tf                      # Provider & Terraform version constraints
├── backend.tf                       # S3 remote state + DynamoDB locking
├── locals.tf                        # Computed values & tagging strategy
├── environments/
│   ├── dev.tfvars                   # Dev: cost-optimized, minimal resources
│   ├── staging.tfvars               # Staging: mirrors prod at reduced scale
│   └── prod.tfvars                  # Prod: full HA, multi-AZ, large instances
└── modules/
    ├── vpc/                         # VPC, subnets, NAT, flow logs
    ├── eks/                         # EKS cluster, node groups, IRSA, KMS
    └── documentdb/                  # DocumentDB cluster, backups, alarms
```

## Usage

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An S3 bucket and DynamoDB table for remote state (see `backend.tf`)

### Commands

```bash
# Initialize Terraform (download providers, configure backend)
terraform init

# Validate syntax and configuration
terraform validate

# Format all .tf files
terraform fmt -recursive

# Plan changes for a specific environment
terraform plan -var-file=environments/dev.tfvars \
  -var="docdb_master_password=YourSecurePassword123"

# Apply changes
terraform apply -var-file=environments/dev.tfvars \
  -var="docdb_master_password=YourSecurePassword123"

# Destroy all resources
terraform destroy -var-file=environments/dev.tfvars \
  -var="docdb_master_password=YourSecurePassword123"
```

### Validate Without AWS Credentials

You can validate the Terraform code locally **without any AWS account** by temporarily commenting out the `backend` block in `backend.tf`:

```bash
# Comment out the backend block, then:
terraform init
terraform validate    # ✅ Checks syntax and module references
terraform fmt -check  # ✅ Checks formatting
```

## Key Design Decisions

| Decision | Rationale |
|:---|:---|
| **Modular structure** | Reusable, testable modules that can be versioned independently |
| **Remote state (S3 + DynamoDB)** | Team-safe state management with locking |
| **KMS encryption** | Kubernetes secrets encrypted at rest in etcd |
| **IRSA (OIDC)** | Pod-level IAM roles instead of node-level (least privilege) |
| **VPC Flow Logs** | Network traffic auditing for security compliance |
| **DocumentDB over self-managed MongoDB** | Managed service = no operational burden for backups, patching, HA |
| **CloudWatch Alarms** | Proactive monitoring for database health |
| **Deletion protection** | Prevents accidental `terraform destroy` of production database |
| **Multi-environment tfvars** | Same code, different configs — DRY principle |

## Cost Estimates (ap-south-1)

| Environment | Monthly Estimate |
|:---|:---|
| **Dev** | ~$90 (1x t3.small node + 1x db.t3.medium) |
| **Staging** | ~$180 (2x t3.medium nodes + 2x db.t3.medium) |
| **Production** | ~$500 (3x t3.large nodes + 3x db.r6g.large) |

> **Note:** Actual costs depend on usage. Use [AWS Pricing Calculator](https://calculator.aws/) for precise estimates.

## Security Highlights

- ✅ **No hardcoded secrets** — passwords passed via `-var` flag or environment variables
- ✅ **Encryption at rest** — KMS for EKS, storage encryption for DocumentDB
- ✅ **Encryption in transit** — TLS enforced on DocumentDB
- ✅ **Network isolation** — EKS and DocumentDB in private subnets only
- ✅ **Least privilege** — Security groups restrict traffic to only necessary ports
- ✅ **Audit logging** — VPC Flow Logs, EKS control plane logs, DocumentDB audit logs
