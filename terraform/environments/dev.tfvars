# ─────────────────────────────────────────────────────────────
# Consistium — Development Environment
# ─────────────────────────────────────────────────────────────
# Optimized for cost: minimal resources, single AZ where
# possible, smaller instances. Suitable for feature testing.
# ─────────────────────────────────────────────────────────────

environment = "dev"
aws_region  = "ap-south-1"

# Networking — Use only 2 AZs to reduce NAT costs
availability_zones   = ["ap-south-1a", "ap-south-1b"]
vpc_cidr             = "10.0.0.0/16"
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]

# EKS — Small cluster for development
cluster_version     = "1.30"
node_instance_types = ["t3.small"]
node_desired_size   = 1
node_min_size       = 1
node_max_size       = 2
node_disk_size      = 20

# DocumentDB — Single instance, minimal retention
docdb_instance_class   = "db.t3.medium"
docdb_instance_count   = 1
docdb_backup_retention = 1

tags = {
  Team = "development"
}
