# ─────────────────────────────────────────────────────────────
# Consistium — Production Environment
# ─────────────────────────────────────────────────────────────
# High availability configuration: multi-AZ, larger instances,
# extended backup retention, and room for autoscaling.
# ─────────────────────────────────────────────────────────────

environment = "prod"
aws_region  = "ap-south-1"

# Networking — Full 3-AZ deployment for HA
availability_zones   = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
vpc_cidr             = "10.2.0.0/16"
private_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
public_subnet_cidrs  = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]

# EKS — Production-grade cluster
cluster_version     = "1.30"
node_instance_types = ["t3.large"]
node_desired_size   = 3
node_min_size       = 2
node_max_size       = 6
node_disk_size      = 50

# DocumentDB — 3 instances across AZs, 7-day backup
docdb_instance_class   = "db.r6g.large"
docdb_instance_count   = 3
docdb_backup_retention = 7

tags = {
  Team        = "platform"
  Criticality = "high"
  OnCall      = "platform-team"
}
