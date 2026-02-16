# Sample Architecture Inputs

Use these sample inputs to test CloudReliant AI's analysis capabilities.

## Sample 1: Basic Web Application (Multiple Issues)

**Description:**
```
I have a web application running on EC2 instances behind an Application Load Balancer.
The database is RDS MySQL in a single AZ. Static assets are served from S3.
User sessions are stored in ElastiCache Redis (single node).
The application runs in us-east-1 and serves global customers.
```

**Services:** EC2, ALB, RDS, S3, ElastiCache

**Region:** us-east-1

**Criticality:** High

**Expected Issues:**
- Single AZ database (no Multi-AZ)
- Single Redis node (no cluster mode)
- No multi-region setup for global customers
- No mention of backups
- No monitoring/alerting mentioned

---

## Sample 2: Serverless Application (Better Architecture)

**Description:**
```
Our application uses API Gateway with Lambda functions for compute.
Data is stored in DynamoDB with on-demand capacity and point-in-time recovery enabled.
Static content is served via CloudFront with S3 as origin.
We have Lambda functions in multiple AZs automatically.
CloudWatch alarms are configured for Lambda errors and DynamoDB throttling.
```

**Services:** API Gateway, Lambda, DynamoDB, S3, CloudFront, CloudWatch

**Region:** us-east-1

**Criticality:** Medium

**Expected Issues:**
- No multi-region setup
- No mention of DynamoDB global tables
- Could improve with WAF on API Gateway

---

## Sample 3: Microservices on ECS (Complex)

**Description:**
```
We run microservices on ECS Fargate across 3 availability zones.
Application Load Balancer distributes traffic to ECS services.
Each service has auto-scaling configured based on CPU and memory.
RDS Aurora PostgreSQL with Multi-AZ and read replicas in us-east-1.
ElastiCache Redis cluster mode enabled with automatic failover.
All logs go to CloudWatch, and we have X-Ray tracing enabled.
Secrets are stored in AWS Secrets Manager.
```

**Services:** ECS, ALB, Aurora, ElastiCache, CloudWatch, X-Ray, Secrets Manager

**Region:** us-east-1

**Criticality:** High

**Expected Issues:**
- No cross-region disaster recovery
- No mention of backup strategy
- Could add Route53 health checks

---

## Sample 4: Data Processing Pipeline (Reliability Concerns)

**Description:**
```
We have an S3 bucket that triggers Lambda functions when files are uploaded.
Lambda processes the data and writes to a single RDS instance.
Results are stored back in S3.
The Lambda function has a 15-minute timeout and 3GB memory.
No retry logic is implemented.
```

**Services:** S3, Lambda, RDS

**Region:** us-west-2

**Criticality:** Medium

**Expected Issues:**
- Single RDS instance (no Multi-AZ)
- No retry logic for Lambda
- No DLQ for failed processing
- No monitoring mentioned
- Lambda timeout might be too long

---

## Sample 5: E-commerce Platform (Production-Ready)

**Description:**
```
Our e-commerce platform runs on EKS with nodes across 3 AZs.
Aurora PostgreSQL Multi-AZ with automated backups and 7-day retention.
Product images in S3 with versioning enabled, served via CloudFront.
ElastiCache Redis cluster for session management with automatic failover.
SQS queues for order processing with DLQ configured.
CloudWatch alarms for all critical metrics with SNS notifications.
Route53 health checks monitor application endpoints.
AWS Backup configured for daily snapshots of all resources.
```

**Services:** EKS, Aurora, S3, CloudFront, ElastiCache, SQS, CloudWatch, Route53, AWS Backup

**Region:** us-east-1

**Criticality:** High

**Expected Issues:**
- Could add multi-region for disaster recovery
- Could implement AWS WAF for security
- Consider adding AWS Shield for DDoS protection

---

## Sample 6: Legacy Migration (Many Issues)

**Description:**
```
We just migrated from on-premises. Single EC2 instance running everything.
MySQL database on the same EC2 instance. No load balancer.
Backups are manual snapshots taken weekly. Application serves customers 24/7.
```

**Services:** EC2

**Region:** us-east-1

**Criticality:** High

**Expected Issues:**
- Single point of failure (everything on one EC2)
- Database on EC2 (should use RDS)
- No load balancing
- No auto-scaling
- Manual backups only
- No monitoring
- No Multi-AZ deployment

---

## Testing Tips

1. Start with Sample 1 or 6 to see how the AI identifies multiple critical issues
2. Use Sample 5 to see how a well-architected system is evaluated
3. Try modifying samples to test specific scenarios
4. Compare results across different criticality levels
5. Test with different regions to see region-specific recommendations

## Custom Test Scenarios

Create your own by including:
- Clear service descriptions
- Deployment topology (single AZ, multi-AZ, multi-region)
- Backup and recovery strategy (or lack thereof)
- Monitoring and alerting setup
- Scaling configuration
- Data durability measures
