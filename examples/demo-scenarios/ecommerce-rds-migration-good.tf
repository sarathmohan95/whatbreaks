# GOOD CONFIGURATION - E-commerce RDS Migration
# This configuration follows AWS Well-Architected Framework principles
# Demonstrates best practices for reliability, security, and performance

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC and Networking - Multi-AZ with proper segmentation
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "ecommerce-vpc"
    Environment = "production"
  }
}

# Private subnets for database across 3 AZs
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "database-subnet-${count.index + 1}"
    Tier = "database"
  }
}

# Private subnets for application across 3 AZs
resource "aws_subnet" "app" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "app-subnet-${count.index + 1}"
    Tier = "application"
  }
}

# Public subnets for ALB across 3 AZs
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 20}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet-${count.index + 1}"
    Tier = "public"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "ecommerce-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# NAT Gateways for private subnets (one per AZ for HA)
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  
  tags = {
    Name = "nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "nat-gw-${count.index + 1}"
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "app" {
  count          = 3
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group - Least Privilege
resource "aws_security_group" "database" {
  name        = "ecommerce-db-sg"
  description = "Database security group - restrictive access"
  vpc_id      = aws_vpc.main.id

  # Only allow MySQL from application tier
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "MySQL from application tier only"
  }

  # Minimal egress - only what's needed
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS services"
  }

  tags = {
    Name = "ecommerce-db-sg"
  }
}

# KMS key for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name = "ecommerce-rds-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/ecommerce-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "ecommerce/db/master-password"
  description             = "Master password for RDS instance"
  recovery_window_in_days = 30
  kms_key_id              = aws_kms_key.rds.id
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "ecommerce_admin"
    password = random_password.db_password.result
  })
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# RDS Subnet Group - Multi-AZ
resource "aws_db_subnet_group" "main" {
  name       = "ecommerce-db-subnet"
  subnet_ids = aws_subnet.database[*].id
  
  tags = {
    Name = "ecommerce-db-subnet"
  }
}

# RDS Parameter Group - Optimized
resource "aws_db_parameter_group" "main" {
  name   = "ecommerce-mysql8"
  family = "mysql8.0"
  
  parameter {
    name  = "slow_query_log"
    value = "1"
  }
  
  parameter {
    name  = "long_query_time"
    value = "2"
  }
  
  parameter {
    name  = "log_queries_not_using_indexes"
    value = "1"
  }
  
  tags = {
    Name = "ecommerce-mysql8-params"
  }
}

# RDS Option Group
resource "aws_db_option_group" "main" {
  name                     = "ecommerce-mysql8-options"
  option_group_description = "Option group for MySQL 8.0"
  engine_name              = "mysql"
  major_engine_version     = "8.0"
  
  tags = {
    Name = "ecommerce-mysql8-options"
  }
}

# Primary RDS Instance - WELL CONFIGURED
resource "aws_db_instance" "main" {
  identifier     = "ecommerce-db-primary"
  engine         = "mysql"
  engine_version = "8.0.35"  # Latest stable version
  instance_class = "db.r6g.xlarge"  # Right-sized for production

  allocated_storage     = 500
  max_allocated_storage = 1000
  storage_type          = "gp3"  # Better performance than gp2
  iops                  = 3000
  storage_throughput    = 125
  
  # Encryption at rest
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn
  
  db_name  = "ecommerce"
  username = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string)["password"]
  
  # Multi-AZ for high availability
  multi_az = true
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  option_group_name      = aws_db_option_group.main.name
  
  # Optimized backup configuration
  backup_retention_period = 30  # 30 days retention
  backup_window          = "03:00-04:00"  # Off-peak hours
  maintenance_window     = "sun:04:30-sun:05:30"  # After backup, weekend
  
  # Controlled upgrades
  auto_minor_version_upgrade = false
  
  # Deletion protection
  deletion_protection = true
  
  # Enhanced monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  
  # Security
  publicly_accessible = false
  
  # Final snapshot on deletion
  skip_final_snapshot       = false
  final_snapshot_identifier = "ecommerce-db-final-snapshot"
  
  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id       = aws_kms_key.rds.arn
  
  # Copy tags to snapshots
  copy_tags_to_snapshot = true
  
  tags = {
    Name        = "ecommerce-db-primary"
    Environment = "production"
    Backup      = "required"
  }
}

# Read Replica 1
resource "aws_db_instance" "replica_1" {
  identifier     = "ecommerce-db-replica-1"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class = "db.r6g.xlarge"
  
  # Replica in different AZ for read scaling
  availability_zone = data.aws_availability_zones.available.names[1]
  
  # Same monitoring and insights as primary
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  
  auto_minor_version_upgrade = false
  publicly_accessible        = false
  
  tags = {
    Name        = "ecommerce-db-replica-1"
    Environment = "production"
    Role        = "read-replica"
  }
}

# Read Replica 2
resource "aws_db_instance" "replica_2" {
  identifier     = "ecommerce-db-replica-2"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class = "db.r6g.xlarge"
  
  availability_zone = data.aws_availability_zones.available.names[2]
  
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  
  auto_minor_version_upgrade = false
  publicly_accessible        = false
  
  tags = {
    Name        = "ecommerce-db-replica-2"
    Environment = "production"
    Role        = "read-replica"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "ecommerce-rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "ecommerce-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Database CPU utilization is too high"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "ecommerce-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Database connections are too high"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

# Application Load Balancer - WELL CONFIGURED
resource "aws_security_group" "alb" {
  name        = "ecommerce-alb-sg"
  description = "ALB security group with HTTPS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet (redirect to HTTPS)"
  }
  
  egress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "To application tier"
  }
  
  tags = {
    Name = "ecommerce-alb-sg"
  }
}

resource "aws_lb" "main" {
  name               = "ecommerce-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  # Enable access logs
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
  }
  
  # Enable deletion protection
  enable_deletion_protection = true
  
  # Enable HTTP/2
  enable_http2 = true
  
  # Drop invalid headers
  drop_invalid_header_fields = true
  
  tags = {
    Name = "ecommerce-alb"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "ecommerce-alb-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "ecommerce-alb-logs"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_caller_identity" "current" {}

# ECS Cluster - WELL CONFIGURED
resource "aws_ecs_cluster" "main" {
  name = "ecommerce-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }
  
  tags = {
    Name = "ecommerce-cluster"
  }
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/ecommerce-exec"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn
}

resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch Logs"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

# ECS Task Definition - WELL CONFIGURED
resource "aws_ecs_task_definition" "api" {
  family                   = "ecommerce-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"  # Right-sized
  memory                   = "2048"  # Right-sized
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "api"
      image = "ecommerce/api:v1.2.3"  # Specific version tag
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_secretsmanager_secret.db_password.arn
        }
      ]
      
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.endpoint
        },
        {
          name  = "DB_REPLICA_1"
          value = aws_db_instance.replica_1.endpoint
        },
        {
          name  = "DB_REPLICA_2"
          value = aws_db_instance.replica_2.endpoint
        },
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "api"
        }
      }
      
      essential = true
    }
  ])
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/ecommerce-api"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn
}

# IAM Roles for ECS
resource "aws_iam_role" "ecs_execution" {
  name = "ecommerce-ecs-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_kms_key.rds.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "ecommerce-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# ECS Service - WELL CONFIGURED with Auto Scaling
resource "aws_ecs_service" "api" {
  name            = "ecommerce-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 6  # 2 per AZ
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = aws_subnet.app[*].id
    security_groups = [aws_security_group.app.id]
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
  
  # Deployment circuit breaker
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  # Health check grace period
  health_check_grace_period_seconds = 60
  
  # Deployment configuration
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  depends_on = [aws_lb_listener.https]
}

resource "aws_security_group" "app" {
  name        = "ecommerce-app-sg"
  description = "App security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "From ALB only"
  }

  egress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
    description     = "To database"
  }
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS services"
  }
  
  tags = {
    Name = "ecommerce-app-sg"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "ecommerce-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  # Robust health check
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  
  # Deregistration delay
  deregistration_delay = 30
  
  tags = {
    Name = "ecommerce-api-tg"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ACM Certificate (placeholder - would use real domain)
resource "aws_acm_certificate" "main" {
  domain_name       = "api.ecommerce.example.com"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "ecommerce-api-cert"
  }
}

# Auto Scaling for ECS Service
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 12
  min_capacity       = 6
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "ecommerce-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Outputs
output "database_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Primary database endpoint"
  sensitive   = true
}

output "database_replica_1_endpoint" {
  value       = aws_db_instance.replica_1.endpoint
  description = "Read replica 1 endpoint"
  sensitive   = true
}

output "database_replica_2_endpoint" {
  value       = aws_db_instance.replica_2.endpoint
  description = "Read replica 2 endpoint"
  sensitive   = true
}

output "alb_dns" {
  value       = aws_lb.main.dns_name
  description = "Load balancer DNS"
}

output "database_secret_arn" {
  value       = aws_secretsmanager_secret.db_password.arn
  description = "ARN of database credentials secret"
  sensitive   = true
}
