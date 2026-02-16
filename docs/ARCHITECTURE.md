# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    CloudFront (CDN)                          │
│                  - Static asset caching                      │
│                  - Global edge locations                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Vercel / Next.js App                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Frontend (React)                        │   │
│  │  - Landing Page                                      │   │
│  │  - Analysis Form                                     │   │
│  │  - Results Dashboard                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Routes (Next.js)                       │   │
│  │  - POST /api/analyze                                 │   │
│  │  - POST /api/generate-pdf                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────┬──────────────────────┬─────────────────────────┘
              │                      │
              │                      │
    ┌─────────▼─────────┐   ┌───────▼──────────┐
    │   OpenAI API      │   │   AWS Services   │
    │                   │   │                  │
    │  - GPT-4 Turbo    │   │  - DynamoDB      │
    │  - Analysis       │   │  - S3            │
    │  - JSON Response  │   │  - CloudWatch    │
    └───────────────────┘   └──────────────────┘
```

## Component Details

### Frontend Layer

**Technology:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS

**Pages:**
- `/` - Landing page with hero, features, and CTA
- `/analyze` - Architecture input form
- `/dashboard` - Results visualization

**Key Features:**
- Server-side rendering for SEO
- Client-side interactivity
- Dark mode support
- Responsive design

### API Layer

**Technology:** Next.js API Routes (Edge Functions on Vercel)

**Endpoints:**

1. `POST /api/analyze`
   - Input: Architecture description, services, region, criticality
   - Process: Calls OpenAI API with structured prompt
   - Output: Analysis result with scores and risks
   - Error handling: Validates input, handles API failures

2. `POST /api/generate-pdf`
   - Input: Analysis result object
   - Process: Generates PDF using jsPDF
   - Output: PDF file download
   - Error handling: Validates data, handles generation errors

### AI Analysis Engine

**Provider:** OpenAI GPT-4 Turbo

**Process Flow:**
1. Receive architecture input
2. Format structured prompt with context
3. Call OpenAI API with JSON mode
4. Parse and validate response
5. Return structured analysis

**Prompt Engineering:**
- System role: AWS Well-Architected expert
- Context: Architecture details
- Output format: Structured JSON
- Focus areas: Reliability best practices

### Data Storage (Optional for Phase 1)

**DynamoDB:**
- Table: `whatbreaks-analyses`
- Primary Key: `id` (String)
- Attributes: timestamp, input, result
- Purpose: Store analysis history

**S3:**
- Bucket: `whatbreaks-reports`
- Purpose: Store generated PDF reports
- Access: Pre-signed URLs for downloads

## Data Flow

### Analysis Flow

```
1. User Input
   ↓
2. Form Validation (Client)
   ↓
3. POST /api/analyze
   ↓
4. Format AI Prompt
   ↓
5. OpenAI API Call
   ↓
6. Parse JSON Response
   ↓
7. Store in LocalStorage (Phase 1)
   ↓
8. Redirect to Dashboard
   ↓
9. Display Results
```

### PDF Generation Flow

```
1. User Clicks "Download Report"
   ↓
2. POST /api/generate-pdf
   ↓
3. Load Analysis Data
   ↓
4. Generate PDF (jsPDF)
   ↓
5. Return PDF Buffer
   ↓
6. Browser Download
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** Custom + shadcn/ui patterns
- **Icons:** Lucide React
- **Charts:** Recharts (for future enhancements)

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js API Routes
- **AI:** OpenAI SDK
- **PDF:** jsPDF
- **AWS SDK:** @aws-sdk/client-dynamodb, @aws-sdk/client-s3

### Infrastructure
- **Hosting:** Vercel (recommended)
- **CDN:** CloudFront (optional)
- **Database:** DynamoDB (optional Phase 1)
- **Storage:** S3 (optional Phase 1)
- **Monitoring:** CloudWatch (optional)

## Security Architecture

### API Security
- Environment variables for secrets
- No client-side API keys
- Rate limiting (Vercel built-in)
- Input validation and sanitization

### AWS Security
- IAM user with minimal permissions
- S3 bucket not publicly accessible
- Pre-signed URLs for downloads
- CORS configuration

### Application Security
- HTTPS only
- Content Security Policy
- XSS protection
- CSRF protection (Next.js built-in)

## Scalability

### Horizontal Scaling
- Vercel automatically scales based on traffic
- Edge functions run globally
- No server management required

### Performance Optimization
- Static page generation where possible
- Image optimization (Next.js built-in)
- Code splitting
- Lazy loading

### Cost Optimization
- Serverless architecture (pay per use)
- Free tier for low traffic
- Efficient API calls
- Caching strategies

## Monitoring & Observability

### Metrics to Track
- API response times
- OpenAI API usage and costs
- Error rates
- User conversion funnel
- PDF generation success rate

### Logging
- API request/response logs
- Error logs with stack traces
- User action logs (privacy-compliant)

### Alerting
- API failure alerts
- High error rate alerts
- Cost threshold alerts

## Disaster Recovery

### Backup Strategy
- Code: Git repository
- Data: DynamoDB point-in-time recovery
- Reports: S3 versioning

### Recovery Procedures
- Vercel: Automatic rollback to previous deployment
- Database: Restore from DynamoDB backup
- Reports: Restore from S3 versions

## Future Enhancements

### Phase 2
- User authentication (AWS Cognito)
- Analysis history dashboard
- Team collaboration features
- Custom scoring weights

### Phase 3
- Multi-pillar analysis (Security, Cost, Performance)
- Infrastructure as Code generation
- Automated remediation scripts
- Integration with AWS Organizations

### Phase 4
- Real-time architecture scanning
- Continuous compliance monitoring
- Cost optimization recommendations
- Architecture comparison tool
