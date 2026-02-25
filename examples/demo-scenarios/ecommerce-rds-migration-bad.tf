# BAD CONFIGURATION - E-commerce RDS Migration
# This configuration violates AWS Well-Architected Framework principles
# and has multiple failure points for demo purposes

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

# VPC and Networking (minimal, single AZ)
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "ecommerce-vpc"
  }
}

resource "aws_subnet" "database" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"  # PROBLEM: Single AZ only
  
  tags = {
    Name = "database-subnet"
  }
}

resource "aws_subnet" "app" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"  # PROBLEM: Same AZ as database
  
  tags = {
    Name = "app-subnet"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

# Security Group - OVERLY PERMISSIVE
resource "aws_security_group" "database" {
  name        = "ecommerce-db-sg"
  description = "Database security group"
  vpc_id      = aws_vpc.main.id

  # PROBLEM: Open to entire VPC, no specific app tier restriction
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "MySQL from VPC"
  }

  # PROBLEM: Allows all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecommerce-db-sg"
  }
}

# RDS Subnet Group - Single AZ
resource "aws_db_subnet_group" "main" {
  name       = "ecommerce-db-subnet"
  subnet_ids = [aws_subnet.database.id]  # PROBLEM: Only one subnet/AZ

  tags = {
    Name = "ecommerce-db-subnet"
  }
}

# RDS Instance - POORLY CONFIGURED
resource "aws_db_instance" "main" {
  identifier     = "ecommerce-db"
  engine         = "mysql"
  engine_version = "5.7"  # PROBLEM: Older version, should use 8.0
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 200  # PROBLEM: No clear capacity planning
  storage_type          = "gp2"  # PROBLEM: Should use gp3 for better performance
  
  # PROBLEM: Not encrypted at rest
  storage_encrypted = false
  
  db_name  = "ecommerce"
  username = "admin"  # PROBLEM: Default username
  password = "Password123!"  # PROBLEM: Hardcoded password in code!
  
  # PROBLEM: Single AZ deployment
  multi_az = false
  
  # PROBLEM: No read replicas for scaling reads
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  # PROBLEM: Backups not optimized
  backup_retention_period = 1  # Only 1 day retention
  backup_window          = "03:00-04:00"  # PROBLEM: During peak traffic hours
  maintenance_window     = "mon:04:00-mon:05:00"  # PROBLEM: Right after backup
  
  # PROBLEM: Auto minor version upgrade enabled without testing
  auto_minor_version_upgrade = true
  
  # PROBLEM: Deletion protection disabled
  deletion_protection = false
  
  # PROBLEM: No enhanced monitoring
  enabled_cloudwatch_logs_exports = []
  monitoring_interval             = 0
  
  # PROBLEM: Public accessibility (even if not used, it's a risk)
  publicly_accessible = true
  
  # PROBLEM: Skip final snapshot on deletion
  skip_final_snapshot = true
  
  # PROBLEM: No performance insights
  performance_insights_enabled = false
  
  tags = {
    Name        = "ecommerce-db"
    Environment = "production"
  }
}

# Application Load Balancer - MINIMAL CONFIGURATION
resource "aws_security_group" "alb" {
  name        = "ecommerce-alb-sg"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # PROBLEM: No HTTPS/443 configured
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "ecommerce-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.app.id]  # PROBLEM: Single subnet/AZ
  
  # PROBLEM: No access logs
  # PROBLEM: No deletion protection
  enable_deletion_protection = false
  
  tags = {
    Name = "ecommerce-alb"
  }
}

# ECS Cluster - MINIMAL SETUP
resource "aws_ecs_cluster" "main" {
  name = "ecommerce-cluster"
  
  # PROBLEM: No container insights
  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

# ECS Task Definition - POORLY CONFIGURED
resource "aws_ecs_task_definition" "api" {
  family                   = "ecommerce-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"  # PROBLEM: Undersized for production
  memory                   = "512"  # PROBLEM: Undersized for production
  
  container_definitions = jsonencode([
    {
      name  = "api"
      image = "ecommerce/api:latest"  # PROBLEM: Using 'latest' tag
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.endpoint
        },
        {
          name  = "DB_PASSWORD"  # PROBLEM: Password in environment variable
          value = "Password123!"
        }
      ]
      
      # PROBLEM: No health check configured
      # PROBLEM: No resource limits
      # PROBLEM: No logging configuration
      
      essential = true
    }
  ])
}

# ECS Service - MINIMAL CONFIGURATION
resource "aws_ecs_service" "api" {
  name            = "ecommerce-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2  # PROBLEM: Fixed count, no auto-scaling
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = [aws_subnet.app.id]  # PROBLEM: Single AZ
    security_groups = [aws_security_group.app.id]
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
  
  # PROBLEM: No deployment circuit breaker
  # PROBLEM: No health check grace period
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
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb_target_group" "api" {
  name        = "ecommerce-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  # PROBLEM: Weak health check
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
  }
}

# Outputs
output "database_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "Database endpoint"
  sensitive   = true
}

output "alb_dns" {
  value       = aws_lb.main.dns_name
  description = "Load balancer DNS"
}
