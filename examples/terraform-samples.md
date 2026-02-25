# Terraform Examples for WhatBreaks Testing

This document contains realistic Terraform scenarios you can use to test WhatBreaks pre-mortem analysis.

## Example 1: Redis Cluster Migration (High Risk)

### Terraform Plan

```hcl
# Current State: Single Redis node
resource "aws_elasticache_replication_group" "session_store" {
  replication_group_id       = "user-sessions"
  replication_group_description = "User session storage"
  engine                     = "redis"
  engine_version            = "7.0"
  node_type                 = "cache.r6g.large"
  num_cache_clusters        = 1
  port                      = 6379
  subnet_group_name         = aws_elasticache_subnet_group.main.name
  security_group_ids        = [aws_security_group.redis.id]
  
  # Single AZ deployment
  automatic_failover_enabled = false
  multi_az_enabled          = false
}

# Proposed Change: Enable cluster mode
resource "aws_elasticache_replication_group" "session_store" {
  replication_group_id       = "user-sessions"
  replication_group_description = "User session storage - CLUSTER MODE"
  engine                     = "redis"
  engine_version            = "7.0"
  node_type                 = "cache.r6g.large"
  port                      = 6379
  subnet_group_name         = aws_elasticache_subnet_group.main.name
  security_group_ids        = [aws_security_group.redis.id]
  
  # CHANGE: Enable cluster mode with 3 shards
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  cluster_mode {
    num_node_groups         = 3  # 3 shards
    replicas_per_node_group = 1  # 1 replica per shard
  }
}
```

### What to Paste in WhatBreaks

```
Change Type: Terraform Plan

Change Description:
Migrating ElastiCache Redis from single-node to cluster mode with 3 shards.

Current State:
- Single Redis node (cache.r6g.large)
- No automatic failover
- Single AZ deployment (us-east-1a)
- Handles 10,000 req/sec peak traffic
- Session TTL: 30 minutes
- Application uses standard redis-py client

Proposed Change (Terraform):
- Enable cluster mode with 3 shards
- Enable automatic failover
- Multi-AZ deployment (us-east-1a, 1b, 1c)
- 1 replica per shard (total 6 nodes)
- Same traffic patterns expected

Application Details:
- Python Flask application
- Uses redis-py 4.5.0
- Connection string: redis://session-store.cache.amazonaws.com:6379
- No code changes planned
- Session middleware: flask-session

Known Dependencies:
- User authentication system
- Shopping cart storage
- API rate limiting
- WebSocket connection tracking
```

**Expected Issues:** Application code not cluster-aware, MOVED errors, retry storms

---

## Example 2: RDS Multi-AZ Conversion (Medium Risk)

### Terraform Plan

```hcl
# Current State: Single-AZ RDS
resource "aws_db_instance" "main" {
  identifier           = "production-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 500
  storage_type        = "gp3"
  
  # Single AZ
  multi_az            = false
  availability_zone   = "us-east-1a"
  
  db_name             = "appdb"
  username            = "admin"
  password            = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# Proposed Change: Enable Multi-AZ
resource "aws_db_instance" "main" {
  identifier           = "production-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 500
  storage_type        = "gp3"
  
  # CHANGE: Enable Multi-AZ
  multi_az            = true
  # availability_zone removed (managed by AWS)
  
  db_name             = "appdb"
  username            = "admin"
  password            = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}
```

### What to Paste in WhatBreaks

```
Change Type: Terraform Plan

Change Description:
Converting RDS PostgreSQL from Single-AZ to Multi-AZ deployment.

Current State:
- RDS PostgreSQL 15.3
- db.r6g.xlarge instance
- Single AZ (us-east-1a)
- 500GB gp3 storage
- 2,000 active connections peak
- Connection pool: 100 connections per app instance
- 20 application instances

Proposed Change (Terraform):
- Enable multi_az = true
- Automatic failover to us-east-1b
- Synchronous replication
- Same instance type and storage

Application Details:
- Node.js application using pg library
- Connection timeout: 5 seconds
- No retry logic on connection failures
- Connection pooling: pg-pool with max 100 connections
- Health checks: Simple SELECT 1 query every 10 seconds

Known Dependencies:
- API servers (20 instances)
- Background job workers (10 instances)
- Scheduled tasks (cron jobs)
- Read replicas in us-east-1b and us-east-1c
```

**Expected Issues:** Connection timeout during failover, connection pool exhaustion, no retry logic

---

## Example 3: EKS Cluster Upgrade (High Risk)

### Terraform Plan

```hcl
# Current State: EKS 1.27
resource "aws_eks_cluster" "main" {
  name     = "production-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.27"
  
  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "main-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  
  scaling_config {
    desired_size = 50
    max_size     = 100
    min_size     = 30
  }
  
  instance_types = ["t3.xlarge"]
  
  # Current version
  version = "1.27"
}

# Proposed Change: Upgrade to 1.28
resource "aws_eks_cluster" "main" {
  name     = "production-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"  # CHANGE: Upgrade version
  
  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "main-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  
  scaling_config {
    desired_size = 50
    max_size     = 100
    min_size     = 30
  }
  
  instance_types = ["t3.xlarge"]
  
  # CHANGE: Upgrade node version
  version = "1.28"
}
```

### What to Paste in WhatBreaks

```
Change Type: Terraform Plan

Change Description:
Upgrading EKS cluster from version 1.27 to 1.28 with rolling node replacement.

Current State:
- EKS cluster version 1.27
- 50 worker nodes (t3.xlarge) across 3 AZs
- 200 pods running (microservices architecture)
- Istio service mesh version 1.18
- ALB Ingress Controller version 2.5
- Cert-manager version 1.12
- Custom admission webhooks using admissionregistration.k8s.io/v1beta1

Proposed Change (Terraform):
- Upgrade control plane to 1.28
- Rolling replacement of all 50 nodes
- In-place upgrade (no blue-green)
- Planned during maintenance window

Application Details:
- 30 microservices deployed
- PodDisruptionBudgets set to maxUnavailable: 1
- HPA configured for 15 services
- StatefulSets for 5 databases
- DaemonSets for logging and monitoring

Known Dependencies:
- Istio 1.18 (compatibility unknown)
- Custom CRDs using deprecated APIs
- Admission webhooks using v1beta1 API
- Third-party operators (Prometheus, Grafana)
- External DNS integration
```

**Expected Issues:** Istio incompatibility, deprecated API usage, webhook failures, pod eviction issues

---

## Example 4: ALB to NLB Migration (Medium Risk)

### Terraform Plan

```hcl
# Current State: Application Load Balancer
resource "aws_lb" "main" {
  name               = "api-load-balancer"
  internal           = false
  load_balancer_type = "application"  # Current: ALB
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  enable_http2              = true
  
  tags = {
    Environment = "production"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# Proposed Change: Network Load Balancer
resource "aws_lb" "main" {
  name               = "api-load-balancer"
  internal           = false
  load_balancer_type = "network"  # CHANGE: ALB to NLB
  # security_groups removed (NLB doesn't use security groups)
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  enable_cross_zone_load_balancing = true
  
  tags = {
    Environment = "production"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "TLS"  # CHANGE: HTTPS to TLS
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}
```

### What to Paste in WhatBreaks

```
Change Type: Terraform Plan

Change Description:
Migrating from Application Load Balancer (ALB) to Network Load Balancer (NLB) for API traffic.

Current State:
- ALB handling HTTPS traffic
- Security groups controlling access
- HTTP/2 enabled
- WebSocket connections supported
- SSL termination at load balancer
- X-Forwarded-For headers preserved
- 50,000 req/sec peak traffic

Proposed Change (Terraform):
- Replace ALB with NLB
- TLS termination at NLB
- Remove security group (NLB uses target security groups)
- Enable cross-zone load balancing

Application Details:
- REST API backend (Node.js)
- WebSocket connections for real-time updates
- Client IP logging for rate limiting
- WAF rules attached to ALB
- CloudWatch metrics based on ALB metrics

Known Dependencies:
- Application expects X-Forwarded-For header
- Rate limiting based on source IP
- WAF rules for DDoS protection
- CloudWatch alarms on ALB metrics
- Auto-scaling based on ALB request count
```

**Expected Issues:** Loss of X-Forwarded-For, WAF incompatibility, security group changes, metric changes

---

## Example 5: S3 Bucket Encryption Change (Low-Medium Risk)

### Terraform Plan

```hcl
# Current State: SSE-S3 encryption
resource "aws_s3_bucket" "uploads" {
  bucket = "user-uploads-prod"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # Current: SSE-S3
    }
  }
}

# Proposed Change: KMS encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"  # CHANGE: SSE-S3 to KMS
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}
```

### What to Paste in WhatBreaks

```
Change Type: Terraform Plan

Change Description:
Changing S3 bucket encryption from SSE-S3 (AES256) to SSE-KMS with customer-managed key.

Current State:
- S3 bucket with SSE-S3 encryption (AES256)
- 500GB of user-uploaded files
- 10,000 uploads per day
- Public read access via CloudFront
- Lambda functions processing uploads
- Cross-region replication to us-west-2

Proposed Change (Terraform):
- Enable SSE-KMS encryption
- Create new KMS key
- Enable bucket key for cost optimization
- Apply to new objects only (existing objects remain SSE-S3)

Application Details:
- Upload API using AWS SDK for JavaScript
- Lambda functions with S3 event triggers
- CloudFront distribution serving files
- Cross-account access from partner accounts
- Lifecycle policies moving to Glacier after 90 days

Known Dependencies:
- Lambda execution role needs KMS permissions
- CloudFront may need KMS access
- Partner accounts need KMS key access
- Replication destination needs KMS permissions
- Existing objects remain SSE-S3 encrypted
```

**Expected Issues:** Lambda permission errors, CloudFront access issues, cross-account access failures, replication failures

---

## How to Use These Examples

### 1. Copy the "What to Paste in WhatBreaks" Section

Each example has a formatted section ready to paste into WhatBreaks.

### 2. Paste into WhatBreaks Input Form

1. Go to http://localhost:3000/analyze
2. Paste the entire "Change Description" section
3. Select "Terraform Plan" as change type
4. Click "Generate Pre-Mortem Report"

### 3. Review the Generated Report

WhatBreaks will:
- Assume the change caused an outage
- Reconstruct the failure timeline
- Identify hidden dependencies
- Suggest preventive actions

### 4. Compare with Expected Issues

Each example lists expected issues. See if WhatBreaks identifies them!

## Tips for Best Results

### Be Specific
- Include version numbers
- Mention traffic patterns
- List known dependencies
- Describe application behavior

### Provide Context
- Current state details
- Proposed changes
- Application architecture
- Monitoring setup

### Include Technical Details
- Connection timeouts
- Retry logic (or lack thereof)
- Health check configurations
- Auto-scaling triggers

## Creating Your Own Examples

When testing with your own Terraform:

1. **Describe Current State**
   - What exists now
   - How it's configured
   - Traffic patterns
   - Dependencies

2. **Describe Proposed Change**
   - What will change
   - Why you're making the change
   - Expected behavior

3. **Add Application Context**
   - How apps connect
   - Error handling
   - Monitoring
   - Fallback mechanisms

4. **List Known Dependencies**
   - Other services
   - External systems
   - Monitoring/alerting
   - Auto-scaling

---

**Pro Tip:** The more detail you provide, the more realistic and useful the pre-mortem report will be!
