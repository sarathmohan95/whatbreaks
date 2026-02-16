# Infrastructure Diagram

## System Architecture Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                          INTERNET / USERS                             │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ HTTPS
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                                                                         │
│                    CloudFront CDN (Optional)                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  • Global edge locations                                      │    │
│  │  • Static asset caching                                       │    │
│  │  • SSL/TLS termination                                        │    │
│  │  • DDoS protection                                            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                                                                         │
│                    Vercel Platform (Hosting)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  │                    Next.js Application                           │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │                                                         │   │  │
│  │  │              FRONTEND (React)                           │   │  │
│  │  │                                                         │   │  │
│  │  │  • Landing Page (/)                                    │   │  │
│  │  │  • Analysis Form (/analyze)                            │   │  │
│  │  │  • Results Dashboard (/dashboard)                      │   │  │
│  │  │  • Dark Mode UI                                        │   │  │
│  │  │  • Responsive Design                                   │   │  │
│  │  │                                                         │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │                                                         │   │  │
│  │  │           API ROUTES (Serverless)                       │   │  │
│  │  │                                                         │   │  │
│  │  │  • POST /api/analyze                                   │   │  │
│  │  │    - Receives architecture input                       │   │  │
│  │  │    - Calls AI analysis engine                          │   │  │
│  │  │    - Returns structured results                        │   │  │
│  │  │                                                         │   │  │
│  │  │  • POST /api/generate-pdf                              │   │  │
│  │  │    - Receives analysis data                            │   │  │
│  │  │    - Generates PDF report                              │   │  │
│  │  │    - Returns downloadable file                         │   │  │
│  │  │                                                         │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  └──────────────────┬──────────────────────┬────────────────────────┘  │
│                     │                      │                            │
└─────────────────────┼──────────────────────┼────────────────────────────┘
                      │                      │
                      │                      │
        ┌─────────────▼──────────┐  ┌────────▼─────────────────┐
        │                        │  │                          │
        │    OpenAI API          │  │    AWS Services          │
        │                        │  │                          │
        │  ┌──────────────────┐ │  │  ┌────────────────────┐ │
        │  │                  │ │  │  │                    │ │
        │  │  GPT-4 Turbo     │ │  │  │    DynamoDB        │ │
        │  │                  │ │  │  │                    │ │
        │  │  • Analysis      │ │  │  │  • Analysis        │ │
        │  │  • JSON Mode     │ │  │  │    History         │ │
        │  │  • Structured    │ │  │  │  • User Data       │ │
        │  │    Output        │ │  │  │  • On-Demand       │ │
        │  │                  │ │  │  │    Billing         │ │
        │  │                  │ │  │  │                    │ │
        │  └──────────────────┘ │  │  └────────────────────┘ │
        │                        │  │                          │
        └────────────────────────┘  │  ┌────────────────────┐ │
                                    │  │                    │ │
                                    │  │    S3 Bucket       │ │
                                    │  │                    │ │
                                    │  │  • PDF Reports     │ │
                                    │  │  • Versioning      │ │
                                    │  │  • Pre-signed      │ │
                                    │  │    URLs            │ │
                                    │  │                    │ │
                                    │  └────────────────────┘ │
                                    │                          │
                                    │  ┌────────────────────┐ │
                                    │  │                    │ │
                                    │  │   CloudWatch       │ │
                                    │  │                    │ │
                                    │  │  • Logs            │ │
                                    │  │  • Metrics         │ │
                                    │  │  • Alarms          │ │
                                    │  │                    │ │
                                    │  └────────────────────┘ │
                                    │                          │
                                    └──────────────────────────┘
```

## Data Flow Diagram

### Analysis Request Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Enters architecture details
     │
┌────▼──────────────┐
│  Analysis Form    │
│  (/analyze)       │
└────┬──────────────┘
     │
     │ 2. POST request with:
     │    - description
     │    - services[]
     │    - region
     │    - criticality
     │
┌────▼──────────────┐
│  API Route        │
│  /api/analyze     │
└────┬──────────────┘
     │
     │ 3. Validate input
     │
┌────▼──────────────┐
│  AI Analyzer      │
│  (analyzer.ts)    │
└────┬──────────────┘
     │
     │ 4. Format prompt with context
     │
┌────▼──────────────┐
│  OpenAI API       │
│  GPT-4 Turbo      │
└────┬──────────────┘
     │
     │ 5. Return JSON:
     │    - summary
     │    - scores
     │    - risks[]
     │
┌────▼──────────────┐
│  API Route        │
│  Response         │
└────┬──────────────┘
     │
     │ 6. Store in localStorage
     │    (Phase 1)
     │
┌────▼──────────────┐
│  Dashboard        │
│  (/dashboard)     │
└────┬──────────────┘
     │
     │ 7. Display results
     │
┌────▼──────────────┐
│  User sees:       │
│  - Score          │
│  - Risks          │
│  - Recommendations│
└───────────────────┘
```

### PDF Generation Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Clicks "Download Report"
     │
┌────▼──────────────┐
│  Dashboard        │
└────┬──────────────┘
     │
     │ 2. POST analysis data
     │
┌────▼──────────────┐
│  API Route        │
│  /api/generate-pdf│
└────┬──────────────┘
     │
     │ 3. Load analysis result
     │
┌────▼──────────────┐
│  PDF Generator    │
│  (generator.ts)   │
└────┬──────────────┘
     │
     │ 4. Create PDF with:
     │    - Header
     │    - Scores
     │    - Risks
     │    - Recommendations
     │
┌────▼──────────────┐
│  jsPDF Library    │
└────┬──────────────┘
     │
     │ 5. Return PDF buffer
     │
┌────▼──────────────┐
│  Browser          │
│  Download         │
└───────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                      Application Layer                        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Landing   │  │   Analyze   │  │     Dashboard       │ │
│  │    Page     │  │    Page     │  │       Page          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ Uses
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                                                                 │
│                     Component Layer                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Button  │  │   Card   │  │  Input   │  │  Select  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │ Textarea │  │  Icons   │  │  Charts  │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│                                                                 │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ Uses
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                                                                 │
│                      Library Layer                              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  AI Analyzer │  │ PDF Generator│  │   Utilities  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │  AWS Clients │  │  Type Defs   │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Development Environment

```
┌─────────────────┐
│  Developer      │
│  Machine        │
│                 │
│  • Node.js 18+  │
│  • npm          │
│  • Git          │
│                 │
│  localhost:3000 │
└─────────────────┘
```

### Production Environment (Vercel)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│                    Vercel Platform                        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │           Edge Network (Global)                  │   │
│  │                                                  │   │
│  │  • Automatic HTTPS                              │   │
│  │  • DDoS protection                              │   │
│  │  • Auto-scaling                                 │   │
│  │  • Zero-config deployment                       │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │         Serverless Functions                     │   │
│  │                                                  │   │
│  │  • API Routes                                   │   │
│  │  • Automatic scaling                            │   │
│  │  • Pay per execution                            │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│                   Security Layers                         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 1: Network Security                       │   │
│  │  • HTTPS only                                    │   │
│  │  • TLS 1.3                                       │   │
│  │  • DDoS protection                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 2: Application Security                   │   │
│  │  • Input validation                              │   │
│  │  • XSS protection                                │   │
│  │  • CSRF protection                               │   │
│  │  • Rate limiting                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 3: Data Security                          │   │
│  │  • Environment variables                         │   │
│  │  • No client-side secrets                        │   │
│  │  • Encrypted at rest (AWS)                       │   │
│  │  • Encrypted in transit                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Layer 4: Access Control                         │   │
│  │  • IAM minimal permissions                       │   │
│  │  • API key rotation                              │   │
│  │  • Pre-signed URLs                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Cost Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│                   Cost Breakdown                          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Vercel Hosting                                  │   │
│  │  • Free tier: Hobby projects                     │   │
│  │  • Pro: $20/month (if needed)                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  OpenAI API                                      │   │
│  │  • GPT-4 Turbo: ~$0.01-0.10 per analysis        │   │
│  │  • 100 analyses: ~$5-10/month                    │   │
│  │  • 1000 analyses: ~$50-100/month                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  AWS Services (Optional Phase 1)                 │   │
│  │  • DynamoDB: Free tier (25GB, 25 WCU/RCU)       │   │
│  │  • S3: Free tier (5GB, 20K GET requests)        │   │
│  │  • CloudWatch: Free tier (10 metrics)           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Total Estimated Cost                            │   │
│  │  • Low traffic: $5-10/month                      │   │
│  │  • Medium traffic: $50-100/month                 │   │
│  │  • High traffic: $200-500/month                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```
