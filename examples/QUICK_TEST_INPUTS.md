# Quick Test Inputs for WhatBreaks

Copy and paste these directly into the WhatBreaks input field at http://localhost:3000/analyze

---

## Test 1: Redis Cluster Migration (Most Likely to Fail)

**Copy everything below this line:**

```
I'm migrating our user session storage from a single Redis node to Redis cluster mode with 3 shards across 3 availability zones.

Current Setup:
- Single ElastiCache Redis node (cache.r6g.large) in us-east-1a
- Handling 10,000 requests/second at peak
- Session TTL is 30 minutes
- Python Flask application using redis-py 4.5.0 client library
- Connection string: redis://session-store.cache.amazonaws.com:6379
- No application code changes are planned

Proposed Change:
- Enable Redis cluster mode with 3 shards
- One shard per AZ (us-east-1a, us-east-1b, us-east-1c)
- Enable automatic failover
- 1 replica per shard (6 total nodes)
- Keep same traffic patterns

The application currently uses the standard Redis() class from redis-py. Our session middleware is flask-session, and we use Redis for user authentication, shopping cart storage, API rate limiting, and WebSocket connection tracking.

We're planning to deploy this during our maintenance window next week with no downtime expected.
```

**Expected Pre-Mortem:** Should identify that the application will fail because redis-py needs to use RedisCluster class instead of Redis class, leading to MOVED errors and retry storms.

---

## Test 2: RDS Multi-AZ Failover

**Copy everything below this line:**

```
We're converting our production PostgreSQL database from single-AZ to Multi-AZ for better availability.

Current Setup:
- RDS PostgreSQL 15.3 on db.r6g.xlarge
- Single AZ deployment in us-east-1a
- 500GB storage
- 2,000 active database connections at peak
- 20 Node.js application instances
- Connection pool: 100 connections per instance using pg-pool
- Connection timeout: 5 seconds
- No retry logic on connection failures

Proposed Change:
- Enable Multi-AZ (multi_az = true in Terraform)
- Automatic failover to standby in us-east-1b
- Synchronous replication
- Same instance type and configuration

Our application health checks run a simple "SELECT 1" query every 10 seconds. We also have 10 background job workers and several cron jobs that connect to the database. We have read replicas in us-east-1b and us-east-1c for reporting queries.

Planning to enable this during business hours since AWS says it's a seamless change.
```

**Expected Pre-Mortem:** Should identify connection timeout issues during failover, connection pool exhaustion, and lack of retry logic causing cascading failures.

---

## Test 3: Kubernetes Version Upgrade

**Copy everything below this line:**

```
Upgrading our EKS cluster from version 1.27 to 1.28 with rolling node replacement.

Current Setup:
- EKS 1.27 cluster with 50 t3.xlarge nodes across 3 AZs
- Running 200 pods (30 microservices)
- Istio service mesh version 1.18
- ALB Ingress Controller 2.5
- Custom admission webhooks using admissionregistration.k8s.io/v1beta1 API
- PodDisruptionBudgets set to maxUnavailable: 1 for all services
- 5 StatefulSets for databases
- HPA configured for 15 services

Proposed Change:
- Upgrade control plane to 1.28
- Rolling replacement of all 50 nodes
- In-place upgrade (no blue-green cluster)
- Planned during maintenance window

We're using cert-manager 1.12, Prometheus operator, and several custom CRDs. Our application has external DNS integration and uses third-party operators. We haven't checked Istio compatibility with Kubernetes 1.28 yet but assume it will work.

The plan is to run "terraform apply" and let it handle the upgrade automatically.
```

**Expected Pre-Mortem:** Should identify Istio incompatibility, deprecated API issues with webhooks, pod eviction problems due to restrictive PDBs.

---

## Test 4: Load Balancer Migration (ALB to NLB)

**Copy everything below this line:**

```
Migrating from Application Load Balancer to Network Load Balancer for better performance.

Current Setup:
- ALB handling HTTPS traffic for our REST API
- 50,000 requests/second at peak
- Security groups controlling access
- HTTP/2 enabled
- WebSocket connections for real-time updates
- SSL termination at load balancer
- AWS WAF attached for DDoS protection
- CloudWatch alarms based on ALB metrics

Proposed Change:
- Replace ALB with NLB
- TLS termination at NLB instead
- Remove security groups (NLB doesn't use them)
- Enable cross-zone load balancing

Our Node.js application logs client IPs from X-Forwarded-For header for rate limiting. We have auto-scaling rules based on ALB request count metric. The application expects to see the real client IP for geolocation and rate limiting purposes.

We're making this change to reduce latency and improve throughput. Planning to switch DNS over during low-traffic hours.
```

**Expected Pre-Mortem:** Should identify loss of X-Forwarded-For header, WAF incompatibility, broken rate limiting, metric-based alarms failing.

---

## Test 5: S3 Encryption Change

**Copy everything below this line:**

```
Changing S3 bucket encryption from SSE-S3 to SSE-KMS for compliance requirements.

Current Setup:
- S3 bucket with SSE-S3 (AES256) encryption
- 500GB of user-uploaded files
- 10,000 uploads per day
- CloudFront distribution serving files publicly
- Lambda functions triggered on S3 uploads for image processing
- Cross-region replication to us-west-2 for disaster recovery
- Cross-account access from 3 partner accounts

Proposed Change:
- Enable SSE-KMS with new customer-managed key
- Enable bucket key for cost optimization
- Apply to new objects (existing objects stay SSE-S3)

Our Lambda functions have basic S3 permissions (s3:GetObject, s3:PutObject). CloudFront has an OAI for bucket access. Partner accounts have IAM roles with S3 read permissions. We have lifecycle policies that move objects to Glacier after 90 days.

Planning to apply this change via Terraform during business hours since it only affects new uploads.
```

**Expected Pre-Mortem:** Should identify Lambda permission errors (missing KMS permissions), CloudFront access failures, cross-account access breaking, replication failures.

---

## Test 6: Simple but Dangerous Change

**Copy everything below this line:**

```
Changing our API Gateway timeout from 29 seconds to 5 seconds to fail faster.

Current Setup:
- API Gateway REST API with Lambda backend
- Current timeout: 29 seconds (API Gateway maximum)
- Lambda functions have 30-second timeout
- Some Lambda functions call external APIs that can take 10-20 seconds
- No retry logic in the application
- Mobile apps expect responses within 30 seconds

Proposed Change:
- Set API Gateway timeout to 5 seconds
- Keep Lambda timeout at 30 seconds

We want faster failures to improve user experience. If a request takes more than 5 seconds, we'll return an error immediately instead of making users wait.

Our Lambda functions do database queries, call external payment APIs, and process images. Some of these operations regularly take 8-15 seconds during peak hours.
```

**Expected Pre-Mortem:** Should identify that many legitimate requests will timeout, Lambda functions will continue running (zombie executions), potential duplicate operations, user experience degradation.

---

## How to Use

1. **Copy** one of the test inputs above (everything in the code block)
2. **Go to** http://localhost:3000/analyze
3. **Paste** into the "Change Description" field
4. **Click** "Generate Pre-Mortem Report"
5. **Wait** 20-30 seconds for AI analysis
6. **Review** the failure scenario

## What to Look For

The pre-mortem report should include:

- **Assumed Outcome** - The outage that occurred
- **Triggering Event** - What started the failure
- **Hidden Dependencies** - Unexpected connections
- **Cascade Timeline** - How the failure spread
- **Missed Decisions** - Where prevention was possible
- **Preventive Actions** - What to do differently

## Tips

- Start with **Test 1 (Redis)** - it's the most dramatic failure scenario
- **Test 6** is short but should reveal serious issues
- Each test is designed to expose a different type of failure pattern
- The more detail in your input, the better the pre-mortem report

---

**Pro Tip:** After seeing the pre-mortem report, ask yourself: "Would I have thought of this failure scenario before deployment?" That's the value of WhatBreaks!
