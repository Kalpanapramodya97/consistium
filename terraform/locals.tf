# ─────────────────────────────────────────────────────────────
# Consistium — Local Values & Computed Tags
# ─────────────────────────────────────────────────────────────
# Centralized tagging strategy ensures every AWS resource is
# consistently labeled for cost allocation, ownership tracking,
# and automated policy enforcement.
# ─────────────────────────────────────────────────────────────

locals {
  # Naming convention: <project>-<environment>-<resource>
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags applied to every resource via provider default_tags
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/Kalpanapramodya97/consistium"
      CostCenter  = "${var.project_name}-${var.environment}"
    },
    var.tags
  )

  # Database connection string template for Kubernetes secrets
  docdb_connection_string = "mongodb://${var.docdb_master_username}:${var.docdb_master_password}@${module.documentdb.endpoint}:27017/consistium?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
}
