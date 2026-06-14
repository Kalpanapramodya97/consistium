# ─────────────────────────────────────────────────────────────
# Consistium — Root Module (Orchestrator)
# ─────────────────────────────────────────────────────────────
# This is the root module that composes all child modules to
# provision the complete Consistium infrastructure:
#
#   VPC (Networking) → EKS (Kubernetes) → DocumentDB (Database)
#
# Architecture:
#   ┌─────────────────────────────────────────────────┐
#   │                     VPC                         │
#   │  ┌──────────────┐      ┌──────────────────┐    │
#   │  │ Public Subnets│      │ Private Subnets  │    │
#   │  │  (ALB, NAT)  │      │  (EKS, DocDB)   │    │
#   │  └──────────────┘      └──────────────────┘    │
#   │         │                       │               │
#   │         ▼                       ▼               │
#   │  ┌──────────┐          ┌──────────────┐        │
#   │  │ Internet │          │  EKS Cluster │        │
#   │  │ Gateway  │          │  + Node Group │        │
#   │  └──────────┘          └──────┬───────┘        │
#   │                               │                 │
#   │                        ┌──────▼───────┐        │
#   │                        │  DocumentDB  │        │
#   │                        │  (MongoDB)   │        │
#   │                        └──────────────┘        │
#   └─────────────────────────────────────────────────┘
# ─────────────────────────────────────────────────────────────

# ── Provider Configuration ───────────────────────────────────

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Kubernetes & Helm providers are configured after EKS is created.
# They use the cluster's endpoint and auth token for access.
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# ── Data Sources ─────────────────────────────────────────────

# Fetch current AWS account ID and region for use in IAM policies
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ── Module: VPC ──────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
  cluster_name         = "${local.name_prefix}-cluster"
}

# ── Module: EKS ──────────────────────────────────────────────

module "eks" {
  source = "./modules/eks"

  name_prefix         = local.name_prefix
  cluster_version     = var.cluster_version
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_disk_size      = var.node_disk_size

  depends_on = [module.vpc]
}

# ── Module: DocumentDB ───────────────────────────────────────

module "documentdb" {
  source = "./modules/documentdb"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_class     = var.docdb_instance_class
  instance_count     = var.docdb_instance_count
  master_username    = var.docdb_master_username
  master_password    = var.docdb_master_password
  backup_retention   = var.docdb_backup_retention

  # Only allow traffic from EKS worker nodes
  allowed_security_group_ids = [module.eks.node_security_group_id]

  depends_on = [module.vpc]
}

# ── Helm Release: Consistium App ─────────────────────────────
# Deploy the Consistium application using the Helm chart from
# this same repository. This ties the IaC to the app deployment.

resource "helm_release" "consistium" {
  name             = var.project_name
  namespace        = "${var.project_name}-${var.environment}"
  create_namespace = true
  chart            = "${path.root}/../helm/consistium"
  values           = [file("${path.root}/../helm/environments/${var.environment}.yaml")]
  wait             = true
  timeout          = 600

  # Override image tag and database connection
  set {
    name  = "image.repository"
    value = "ghcr.io/kalpanapramodya97/consistium/habit-tracker"
  }

  set_sensitive {
    name  = "backend.env.MONGODB_URI"
    value = local.docdb_connection_string
  }

  set {
    name  = "backend.env.NODE_ENV"
    value = var.environment == "prod" ? "production" : "development"
  }

  depends_on = [module.eks, module.documentdb]
}
