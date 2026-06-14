# ─────────────────────────────────────────────────────────────
# Consistium — DocumentDB Module
# ─────────────────────────────────────────────────────────────
# Creates a MongoDB-compatible DocumentDB cluster with:
#   - TLS encryption in transit
#   - Automated backups with configurable retention
#   - Dedicated subnet group (private subnets only)
#   - Security group limiting access to EKS nodes only
#   - Cluster parameter group for tuning
#
# DocumentDB is AWS's managed MongoDB-compatible service.
# It replaces the self-managed MongoDB container from
# docker-compose.yml with a production-grade alternative.
# ─────────────────────────────────────────────────────────────

# ── Subnet Group ────────────────────────────────────────────
# DocumentDB instances are launched into private subnets only.

resource "aws_docdb_subnet_group" "main" {
  name       = "${var.name_prefix}-docdb-subnets"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.name_prefix}-docdb-subnet-group"
  }
}

# ── Security Group ──────────────────────────────────────────
# Only allows inbound MongoDB traffic (27017) from specified
# security groups (EKS worker nodes).

resource "aws_security_group" "docdb" {
  name_prefix = "${var.name_prefix}-docdb-sg"
  description = "Security group for DocumentDB cluster"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.name_prefix}-docdb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "docdb_ingress" {
  count = length(var.allowed_security_group_ids)

  type                     = "ingress"
  from_port                = 27017
  to_port                  = 27017
  protocol                 = "tcp"
  source_security_group_id = var.allowed_security_group_ids[count.index]
  security_group_id        = aws_security_group.docdb.id
  description              = "Allow MongoDB traffic from EKS nodes"
}

resource "aws_security_group_rule" "docdb_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.docdb.id
  description       = "Allow all outbound traffic"
}

# ── Cluster Parameter Group ─────────────────────────────────
# Customize DocumentDB behavior. TLS is enabled by default.

resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb5.0"
  name        = "${var.name_prefix}-docdb-params"
  description = "DocumentDB parameters for ${var.name_prefix}"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "audit_logs"
    value = "enabled"
  }

  tags = {
    Name = "${var.name_prefix}-docdb-params"
  }
}

# ── DocumentDB Cluster ──────────────────────────────────────

resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "${var.name_prefix}-docdb"
  engine                          = "docdb"
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name

  # Backup configuration
  backup_retention_period = var.backup_retention
  preferred_backup_window = "03:00-04:00" # 3-4 AM UTC (low traffic)

  # Maintenance window (non-overlapping with backup)
  preferred_maintenance_window = "sun:05:00-sun:06:00"

  # Deletion protection — prevent accidental destruction
  deletion_protection = true

  # Skip final snapshot only in dev
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-docdb-final-${formatdate("YYYY-MM-DD", timestamp())}"

  # Enable CloudWatch log exports for auditing
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  storage_encrypted = true

  tags = {
    Name = "${var.name_prefix}-docdb"
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# ── DocumentDB Instances ────────────────────────────────────

resource "aws_docdb_cluster_instance" "main" {
  count = var.instance_count

  identifier         = "${var.name_prefix}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class
  engine             = "docdb"

  # Distribute instances across AZs for HA
  availability_zone = element(
    data.aws_subnet.private[*].availability_zone,
    count.index
  )

  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.name_prefix}-docdb-instance-${count.index + 1}"
  }
}

# ── Data Source: Subnet AZs ─────────────────────────────────
# Look up the AZ of each private subnet for instance placement.

data "aws_subnet" "private" {
  count = length(var.private_subnet_ids)
  id    = var.private_subnet_ids[count.index]
}

# ── CloudWatch Alarms ───────────────────────────────────────
# Basic monitoring alarms for the DocumentDB cluster.

resource "aws_cloudwatch_metric_alarm" "docdb_cpu" {
  alarm_name          = "${var.name_prefix}-docdb-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "DocumentDB CPU utilization exceeds 80% for 15 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.main.cluster_identifier
  }

  tags = {
    Name = "${var.name_prefix}-docdb-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "docdb_connections" {
  alarm_name          = "${var.name_prefix}-docdb-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "DocumentDB connection count exceeds 500"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.main.cluster_identifier
  }

  tags = {
    Name = "${var.name_prefix}-docdb-connections-alarm"
  }
}
