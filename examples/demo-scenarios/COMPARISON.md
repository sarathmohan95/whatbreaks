# E-commerce RDS Migration - Configuration Comparison

## Scenario Overview

**Business Context**: A high-traffic e-commerce platform is migrating from a single RDS MySQL instance to a Multi-AZ deployment with read replicas to handle Black Friday traffic (10x normal load).

**Current State**: Single RDS instance in one AZ, 2 ECS tasks, basic monitoring

**Proposed Change**: Multi-AZ RDS with 2 read replicas, 6 ECS tasks across 3 AZs, enhanced monitoring

---

## Configuration Comparison

### 1. Database Architecture

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Availability Zones** | Single AZ (us-east-1a) | Multi-AZ (3 AZs) | CRITICAL - Single point of failure |
| **Multi-AZ** | Disabled | Enabled | CRITICAL - No automatic failover |
| **Read Replicas** | None | 2 replicas in different AZs | HIGH - Read scaling bottleneck |
| **Instance Class** | db.t3.medium (burstable) | db.r6g.xlarge (memory-optimized) | HIGH - Performance issues under load |
| **Storage Type** | gp2 | gp3 with 3000 IOPS | MEDIUM - Slower I/O performance |

### 2. Security

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Encryption at Rest** | Disabled | Enabled with KMS | CRITICAL - Compliance violation |
| **Password Management** | Hardcoded in code | AWS Secrets Manager | CRITICAL - Security breach risk |
| **Security Groups** | Open to entire VPC | Least privilege (app tier only) | HIGH - Lateral movement risk |
| **Public Access** | Enabled | Disabled | CRITICAL - Internet exposure |
| **SSL/TLS** | HTTP only | HTTPS with TLS 1.2+ | HIGH - Data in transit exposure |

### 3. Backup & Recovery

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Backup Retention** | 1 day | 30 days | HIGH - Limited recovery options |
| **Backup Window** | 3-4 AM (peak hours) | 3-4 AM (off-peak) | MEDIUM - Performance impact |
| **Final Snapshot** | Disabled | Enabled | HIGH - Data loss on deletion |
| **Deletion Protection** | Disabled | Enabled | CRITICAL - Accidental deletion |

### 4. Monitoring & Observability

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Enhanced Monitoring** | Disabled | Enabled (60s intervals) | HIGH - Blind to issues |
| **Performance Insights** | Disabled | Enabled with 7-day retention | HIGH - No query analysis |
| **CloudWatch Logs** | None | Error, general, slow query logs | HIGH - No audit trail |
| **Container Insights** | Disabled | Enabled | MEDIUM - No ECS metrics |
| **CloudWatch Alarms** | None | CPU, connections, memory | HIGH - No proactive alerts |

### 5. Application Tier

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Availability Zones** | Single AZ | 3 AZs | CRITICAL - Single point of failure |
| **Task Count** | Fixed 2 tasks | 6 tasks with auto-scaling (6-12) | HIGH - Cannot handle traffic spikes |
| **Resource Sizing** | 256 CPU / 512 MB | 1024 CPU / 2048 MB | HIGH - OOM kills under load |
| **Health Checks** | Weak (/ endpoint) | Robust (/health endpoint) | MEDIUM - False positives |
| **Deployment** | No circuit breaker | Circuit breaker with rollback | HIGH - Bad deployments propagate |
| **Image Tags** | :latest | :v1.2.3 (specific version) | MEDIUM - Unpredictable deployments |

### 6. Network Architecture

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Subnets** | Single subnet per tier | 3 subnets per tier (multi-AZ) | CRITICAL - No redundancy |
| **NAT Gateways** | None shown | 3 NAT Gateways (one per AZ) | HIGH - Outbound connectivity failure |
| **ALB Subnets** | Single subnet | 3 public subnets | CRITICAL - ALB single point of failure |
| **Route Tables** | Basic | Per-AZ route tables | MEDIUM - Routing failures |

### 7. Operational Excellence

| Aspect | BAD Configuration | GOOD Configuration | Risk Impact |
|--------|------------------|-------------------|-------------|
| **Auto Minor Upgrades** | Enabled | Disabled (controlled) | MEDIUM - Unexpected breaking changes |
| **Maintenance Window** | Right after backup | Weekend, after backup | LOW - Maintenance conflicts |
| **ALB Access Logs** | Disabled | Enabled to S3 | MEDIUM - No audit trail |
| **KMS Key Rotation** | N/A | Enabled | LOW - Compliance requirement |

---

## Well-Architected Framework Violations (BAD Config)

### Reliability Pillar
- ❌ Single AZ deployment (no fault tolerance)
- ❌ No read replicas (read scaling bottleneck)
- ❌ No auto-scaling (cannot handle traffic spikes)
- ❌ Weak health checks (false positives)
- ❌ No deployment circuit breaker (bad deploys propagate)

### Security Pillar
- ❌ No encryption at rest (compliance violation)
- ❌ Hardcoded passwords (credential exposure)
- ❌ Overly permissive security groups (lateral movement)
- ❌ Public database access enabled (internet exposure)
- ❌ No HTTPS (data in transit exposure)
- ❌ No secrets management (credential leaks)

### Performance Efficiency Pillar
- ❌ Undersized instances (CPU/memory constraints)
- ❌ Old MySQL version (missing performance features)
- ❌ gp2 storage (lower IOPS)
- ❌ No read replicas (read bottleneck)
- ❌ No performance insights (blind optimization)

### Cost Optimization Pillar
- ❌ Burstable instances in production (credit exhaustion)
- ❌ No auto-scaling (paying for idle capacity)
- ❌ Short backup retention (may need longer for compliance)

### Operational Excellence Pillar
- ❌ No monitoring/alerting (reactive operations)
- ❌ No logging (no audit trail)
- ❌ Auto minor upgrades enabled (unexpected changes)
- ❌ Using :latest tags (unpredictable deployments)
- ❌ No container insights (blind to ECS issues)

---

## Expected Failure Scenarios (BAD Config)

### Scenario 1: AZ Failure
**Trigger**: us-east-1a experiences an outage (happens 2-3 times per year)
**Impact**: 
- Database goes offline (no Multi-AZ failover)
- All application tasks go offline (single AZ)
- ALB becomes unavailable (single subnet)
- **Total outage duration**: 2-4 hours
- **Revenue impact**: $500K-$2M (depending on traffic)

### Scenario 2: Black Friday Traffic Spike
**Trigger**: Traffic increases 10x (from 10K to 100K requests/sec)
**Impact**:
- Database connections maxed out (no read replicas)
- Application tasks OOM killed (undersized)
- No auto-scaling (fixed 2 tasks)
- Database CPU at 100% (burstable credits exhausted)
- **Degraded performance**: 4-6 hours
- **Cart abandonment rate**: 60%+

### Scenario 3: Database Credential Leak
**Trigger**: Hardcoded password committed to GitHub
**Impact**:
- Credentials exposed publicly
- Database accessible from internet (publicly_accessible = true)
- No encryption at rest (data readable)
- **Data breach**: Customer PII, payment info
- **Compliance fines**: $2M-$10M (GDPR, PCI-DSS)

### Scenario 4: Accidental Database Deletion
**Trigger**: Engineer runs `terraform destroy` in wrong environment
**Impact**:
- No deletion protection (database deleted)
- No final snapshot (skip_final_snapshot = true)
- Only 1 day of backups (backup_retention_period = 1)
- **Data loss**: Potentially unrecoverable
- **Recovery time**: Days to weeks

### Scenario 5: Bad Deployment
**Trigger**: New code version has a memory leak
**Impact**:
- No circuit breaker (bad version deployed to all tasks)
- Using :latest tag (can't rollback to specific version)
- Weak health checks (tasks appear healthy initially)
- All tasks crash within 30 minutes
- **Total outage**: 1-2 hours

---

## Demo Script

### Part 1: Upload BAD Configuration
1. Upload `ecommerce-rds-migration-bad.tf`
2. Show security issues detected:
   - HIGH: No encryption at rest
   - HIGH: Hardcoded password
   - HIGH: Public database access
   - MEDIUM: Single AZ deployment
3. Generate pre-mortem report
4. Review identified risks:
   - AZ failure causing total outage
   - Traffic spike overwhelming system
   - Security breach from exposed credentials
   - Data loss from accidental deletion
5. Show preventive actions prioritized by risk

### Part 2: Upload GOOD Configuration
1. Upload `ecommerce-rds-migration-good.tf`
2. Show security issues detected:
   - LOW: Minor recommendations only
3. Generate pre-mortem report
4. Review identified risks:
   - Much lower probability and impact scores
   - Risks are mostly operational (e.g., "failover takes 60-120 seconds")
   - Mitigation strategies already in place
5. Compare risk scores:
   - BAD config: Overall risk score 85+ (CRITICAL)
   - GOOD config: Overall risk score 25-35 (LOW-MODERATE)

### Part 3: Side-by-Side Comparison
1. Show history page with both reports
2. Compare risk levels visually
3. Highlight cost difference:
   - BAD: ~$500/month infrastructure
   - GOOD: ~$2,500/month infrastructure
   - But GOOD prevents $500K-$2M outage costs
4. ROI calculation: 5x cost pays for itself in one prevented incident

---

## Key Talking Points

1. **"This isn't theoretical"** - These are real failure patterns from production incidents
2. **"Well-Architected Framework exists for a reason"** - Each violation has caused real outages
3. **"Security is not optional"** - Compliance fines can exceed infrastructure costs by 100x
4. **"Multi-AZ is not expensive insurance"** - It's essential for production workloads
5. **"Monitoring is not overhead"** - You can't fix what you can't see
6. **"The bad config costs less upfront"** - But one outage costs more than years of proper infrastructure
7. **"This tool helps catch issues before deployment"** - Pre-mortem analysis prevents post-mortem regrets

---

## Questions to Ask During Demo

1. "What would happen if us-east-1a went down right now?"
2. "How would you know if your database is running out of connections?"
3. "What's your RTO (Recovery Time Objective) for a database failure?"
4. "How do you rotate database credentials?"
5. "Can you rollback a bad deployment in under 5 minutes?"
6. "What's the cost of a 4-hour outage during Black Friday?"

---

## Additional Demo Scenarios

You can also create variations:
- **Scenario A**: Start with BAD, show pre-mortem, then show how to fix each issue
- **Scenario B**: Upload GOOD first, then show what happens if you remove protections
- **Scenario C**: Use templates to quickly generate similar scenarios for different services

---

## Files for Demo

- `ecommerce-rds-migration-bad.tf` - Upload this first
- `ecommerce-rds-migration-good.tf` - Upload this second
- `COMPARISON.md` - Reference during demo (this file)

**Pro Tip**: Keep both reports in history and switch between them to show the dramatic difference in risk scores and identified issues.
