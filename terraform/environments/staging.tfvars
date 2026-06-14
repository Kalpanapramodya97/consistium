# ─────────────────────────────────────────────────────────────
# Consistium — Staging Environment
# ─────────────────────────────────────────────────────────────
# Mirrors production topology at reduced scale. Used for
# integration testing and pre-release validation.
# ─────────────────────────────────────────────────────────────

environment = "staging"
aws_region  = "ap-south-1"

# Networking — 3 AZs to match production topology
availability_zones   = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
vpc_cidr             = "10.1.0.0/16"
private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]

# EKS — Medium cluster, mirrors prod topology
cluster_version     = "1.30"
node_instance_types = ["t3.medium"]
node_desired_size   = 2
node_min_size       = 1
node_max_size       = 3
node_disk_size      = 20

# DocumentDB — 2 instances for replica testing
docdb_instance_class   = "db.t3.medium"
docdb_instance_count   = 2
docdb_backup_retention = 3

tags = {
  Team = "platform"
}
