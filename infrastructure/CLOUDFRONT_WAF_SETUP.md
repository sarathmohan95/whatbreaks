# CloudFront + WAF Setup for WhatBreaks

## Overview

This setup provides a secure, cost-effective way to host the WhatBreaks frontend with protection against bots and malicious traffic.

## Architecture

```
User → CloudFront (CDN) → WAF (Bot Protection) → S3 (Static Assets)
```

### Components

1. **S3 Bucket**: Hosts the static Next.js export
2. **CloudFront**: Global CDN for fast content delivery
3. **WAF (Web Application Firewall)**: Protects against bots and attacks
4. **Origin Access Control (OAC)**: Secures S3 bucket access

## WAF Protection Rules (All FREE!)

### 1. AWS Managed Rules - Core Rule Set (CRS)
- Protects against common web exploits (SQL injection, XSS, etc.)
- **Cost**: FREE (included in WAF base pricing)

### 2. AWS Managed Rules - Known Bad Inputs
- Blocks requests with known malicious patterns
- **Cost**: FREE (included in WAF base pricing)

### 3. AWS Managed Rules - Anonymous IP List
- Blocks requests from VPNs, proxies, and Tor exit nodes
- Prevents anonymous traffic that could be malicious
- **Cost**: FREE (included in WAF base pricing)

### 4. AWS Managed Rules - Amazon IP Reputation List
- Blocks IPs with poor reputation based on Amazon threat intelligence
- Uses AWS's global threat data
- **Cost**: FREE (included in WAF base pricing)

### 5. Rate Limiting
- Limits: 2000 requests per 5 minutes per IP
- Prevents abuse and reduces costs
- **Cost**: FREE (included in WAF base pricing)

### 6. Geo-Blocking (Optional - Currently Disabled)
- Can block specific countries if needed
- Uncomment in `cloudfront-waf.tf` to enable
- **Cost**: FREE (included in WAF base pricing)

## Cost Breakdown

### Monthly Costs (Estimated for Low-Medium Traffic)

| Service | Cost | Notes |
|---------|------|-------|
| CloudFront | $0.085/GB + $0.01/10k requests | First 1TB free tier available |
| WAF | $5/month + $1/million requests | Base + request fees |
| S3 Storage | $0.023/GB | Very low for static site |
| S3 Requests | $0.0004/1k GET | Minimal with CloudFront |
| CloudFront Invalidations | First 1000/month free | $0.005 per path after |

**Estimated Total**: $5-15/month for moderate traffic (< 1 million requests)

### Cost Optimization Tips

1. **CloudFront Caching**: Aggressive caching reduces origin requests
2. **Price Class 100**: Uses only North America and Europe (cheapest)
3. **Free WAF Rules**: All managed rules are free (no Bot Control charges)
4. **Rate Limiting**: Prevents abuse and excessive charges
5. **7-Day Log Retention**: Reduces CloudWatch costs
6. **Anonymous IP Blocking**: Reduces malicious traffic and costs

## Deployment

### Prerequisites

1. Terraform installed
2. AWS CLI configured
3. Node.js and npm installed

### Step 1: Deploy Infrastructure

```powershell
cd infrastructure
terraform init
terraform plan
terraform apply
```

This creates:
- S3 bucket for frontend
- CloudFront distribution
- WAF Web ACL with bot protection
- All necessary IAM policies

### Step 2: Build and Deploy Frontend

```powershell
# From infrastructure directory
./deploy-frontend.ps1
```

Or manually:

```powershell
# Build Next.js app
cd frontend
npm run build

# Deploy to S3
cd ../infrastructure
$bucket = terraform output -raw frontend_s3_bucket
aws s3 sync ../frontend/out s3://$bucket/ --delete

# Invalidate CloudFront cache
$distId = terraform output -raw cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id $distId --paths "/*"
```

### Step 3: Update API Endpoint

Update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://7klnvxi9lh.execute-api.us-east-1.amazonaws.com
```

Then rebuild and redeploy.

## Monitoring

### CloudWatch Metrics

Monitor these metrics in CloudWatch:

1. **WAF Metrics**:
   - `AllowedRequests`: Legitimate traffic
   - `BlockedRequests`: Blocked by WAF rules
   - `CountedRequests`: Requests that matched rules but weren't blocked

2. **CloudFront Metrics**:
   - `Requests`: Total requests
   - `BytesDownloaded`: Data transfer
   - `4xxErrorRate`: Client errors
   - `5xxErrorRate`: Server errors

### WAF Logs

WAF logs are stored in CloudWatch Logs:
- Log Group: `/aws/wafv2/whatbreaks-frontend`
- Retention: 7 days

View logs:
```powershell
aws logs tail /aws/wafv2/whatbreaks-frontend --follow
```

## Security Features

### 1. Bot Protection
- Blocks automated scrapers and bots
- Allows legitimate search engine crawlers
- Prevents credential stuffing and account takeover

### 2. Rate Limiting
- 2000 requests per 5 minutes per IP
- Prevents DDoS and abuse
- Returns 429 status code when exceeded

### 3. HTTPS Only
- All HTTP traffic redirected to HTTPS
- TLS 1.2+ required
- CloudFront default certificate (free)

### 4. Origin Access Control
- S3 bucket not publicly accessible
- Only CloudFront can access content
- Prevents direct S3 access

### 5. Common Web Exploits Protection
- SQL injection prevention
- Cross-site scripting (XSS) protection
- Known bad input blocking

## Custom Domain Setup (Optional)

To use a custom domain:

1. **Request ACM Certificate** (in us-east-1):
```hcl
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us-east-1  # Must be in us-east-1 for CloudFront
  domain_name       = "whatbreaks.example.com"
  validation_method = "DNS"
}
```

2. **Update CloudFront Distribution**:
```hcl
viewer_certificate {
  acm_certificate_arn      = aws_acm_certificate.frontend.arn
  ssl_support_method       = "sni-only"
  minimum_protocol_version = "TLSv1.2_2021"
}

aliases = ["whatbreaks.example.com"]
```

3. **Create Route 53 Record**:
```hcl
resource "aws_route53_record" "frontend" {
  zone_id = var.route53_zone_id
  name    = "whatbreaks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
```

## Troubleshooting

### Issue: 403 Forbidden Errors

**Cause**: S3 bucket policy not allowing CloudFront access

**Solution**:
```powershell
terraform apply  # Reapply to fix bucket policy
```

### Issue: Old Content Showing

**Cause**: CloudFront cache not invalidated

**Solution**:
```powershell
$distId = terraform output -raw cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id $distId --paths "/*"
```

### Issue: High WAF Costs

**Cause**: Too many bot requests or high traffic

**Solutions**:
1. Review WAF metrics to identify attack patterns
2. Add more specific blocking rules
3. Reduce rate limit threshold
4. Consider disabling Bot Control rule if not needed

### Issue: Legitimate Users Blocked

**Cause**: WAF rules too strict

**Solutions**:
1. Review WAF logs to identify false positives
2. Add IP whitelist rules for known good IPs
3. Adjust Bot Control inspection level
4. Create custom rules to allow specific patterns

## Maintenance

### Regular Tasks

1. **Monitor Costs**: Check AWS Cost Explorer weekly
2. **Review WAF Logs**: Look for attack patterns
3. **Update Dependencies**: Keep Next.js and packages updated
4. **Test Deployments**: Verify site works after updates

### Updating the Site

```powershell
# Make changes to frontend code
cd frontend
# ... make changes ...

# Deploy
cd ../infrastructure
./deploy-frontend.ps1
```

## Cleanup

To remove all resources:

```powershell
cd infrastructure

# Empty S3 buckets first
$bucket = terraform output -raw frontend_s3_bucket
aws s3 rm s3://$bucket --recursive

# Destroy infrastructure
terraform destroy
```

## Additional Resources

- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
