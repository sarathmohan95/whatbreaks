variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "whatbreaks"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "Allowed CORS origins for API Gateway"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources for cost tracking"
  type        = map(string)
  default = {
    Project     = "WhatBreaks"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
