# ─────────────────────────────────────────────────────────────
# Consistium — Root Outputs
# ─────────────────────────────────────────────────────────────
# Outputs are the "return values" of this Terraform config.
# They are displayed after `terraform apply` and can be
# queried with `terraform output <name>`.
# ─────────────────────────────────────────────────────────────

# ── Networking ───────────────────────────────────────────────

output "vpc_id" {
  description = "ID of the VPC."
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets."
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = module.vpc.public_subnet_ids
}

# ── EKS ──────────────────────────────────────────────────────

output "eks_cluster_name" {
  description = "Name of the EKS cluster."
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL for the EKS API server."
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_version" {
  description = "Kubernetes version running on the cluster."
  value       = module.eks.cluster_version
}

output "kubeconfig_command" {
  description = "AWS CLI command to configure kubectl."
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

# ── Database ─────────────────────────────────────────────────

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint for application connections."
  value       = module.documentdb.endpoint
}

output "documentdb_port" {
  description = "DocumentDB cluster port."
  value       = module.documentdb.port
}

# ── Application ──────────────────────────────────────────────

output "app_namespace" {
  description = "Kubernetes namespace where Consistium is deployed."
  value       = "${var.project_name}-${var.environment}"
}

output "app_access_instructions" {
  description = "Instructions to access the deployed application."
  value       = <<-EOT
    ┌─────────────────────────────────────────────────────┐
    │           ◆ Consistium — Deployed!                  │
    ├─────────────────────────────────────────────────────┤
    │                                                     │
    │  1. Configure kubectl:                              │
    │     ${module.eks.cluster_name}                      │
    │                                                     │
    │  2. Get the app URL:                                │
    │     kubectl get ingress -n ${var.project_name}-${var.environment}  │
    │                                                     │
    │  3. View pods:                                      │
    │     kubectl get pods -n ${var.project_name}-${var.environment}     │
    │                                                     │
    └─────────────────────────────────────────────────────┘
  EOT
}
