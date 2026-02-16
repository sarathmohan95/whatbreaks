# WhatBreaks

> 🚀 **New here?** Start with [START_HERE.md](START_HERE.md) for the quickest path to get running!

**AI-powered pre-mortem engine that simulates how cloud systems could fail in the future, before any outage occurs.**

Instead of reacting to incidents, WhatBreaks uses AI-driven counterfactual reasoning to generate realistic reliability failure scenarios from infrastructure changes. Submit a proposed change, and the system assumes it caused a future outage, then reconstructs the failure timeline backwards.

**Status:** ✅ MVP in Development | **Category:** Commercial Solutions | **Focus:** Pre-Mortem Simulation

## What Makes This Different?

### Traditional Approach ❌
- React to incidents after they happen
- Monitor systems that are already live
- Analyze outages post-mortem
- Hope testing catches everything

### WhatBreaks Approach ✅
- **Simulate failures before deployment**
- **Assume the change caused an outage**
- **Reconstruct the failure timeline**
- **Expose hidden risks proactively**

## Core Concept

WhatBreaks performs **counterfactual reasoning**: it assumes your infrastructure change caused a future outage, then works backwards to tell you how it happened. You get a realistic failure narrative with:

- **Triggering Event** - What started the failure
- **Hidden Dependencies** - Unexpected connections exposed
- **Cascade Timeline** - How failure spread over time
- **Missed Decisions** - Where prevention was possible
- **Preventive Actions** - What to do differently

## Architecture Overview

### System Components

```
┌─────────────────┐
│   CloudFront    │ (CDN)
└────────┬────────┘
         │
┌────────▼────────┐
│   Next.js App   │ (Frontend + API Routes)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────────┐
│Bedrock│ │  DynamoDB   │
│(AI)   │ │  (History)  │
└───┬───┘ └─────────────┘
    │
┌───▼───┐
│  S3   │
│(PDFs) │
└───────┘
```

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Engine**: Amazon Bedrock (Claude 3)
- **Orchestration**: AWS Step Functions (Phase 2)
- **Database**: DynamoDB (pre-mortem history)
- **Storage**: S3 (PDF reports)
- **Compute**: AWS Lambda
- **Deployment**: Vercel (frontend) + AWS (backend)

## Project Structure

```
whatbreaks/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Landing page
│   │   ├── analyze/           # Analysis flow
│   │   ├── dashboard/         # Results dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── landing/          # Landing page sections
│   │   ├── analysis/         # Analysis form & results
│   │   └── dashboard/        # Dashboard widgets
│   ├── lib/                   # Utilities
│   │   ├── ai/               # AI integration
│   │   ├── aws/              # AWS SDK clients
│   │   ├── pdf/              # PDF generation
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── infrastructure/            # AWS CDK/CloudFormation
└── docs/                      # Documentation
```

## Features

### Phase 1 - MVP (Current)

✅ Infrastructure change input (Terraform plans, config updates, plain English)  
✅ AI-powered pre-mortem generation using counterfactual reasoning  
✅ Structured failure narratives with timeline reconstruction  
✅ Cascading effect analysis  
✅ Hidden dependency identification  
✅ Downloadable PDF pre-mortem reports  
✅ Modern, professional UI  
✅ Dark mode support

### Phase 2 - Enhanced (Planned)

- Multiple failure scenario generation
- Scenario comparison view
- AWS Step Functions orchestration
- DynamoDB history storage
- Terraform plan JSON parsing
- Configurable risk perspectives

## 🎯 Quick Start

**Get running in 5 minutes:**

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Add your OpenAI API key to .env.local

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

**Detailed guides:**
- 🚀 [START_HERE.md](START_HERE.md) - Your starting point
- ⚡ [QUICK_START.md](QUICK_START.md) - 5-minute setup
- 📦 [INSTALLATION.md](INSTALLATION.md) - Complete installation guide
- 💻 [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) - Development guide

### Environment Variables

```
# AI Provider
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
DYNAMODB_TABLE_NAME=whatbreaks-analyses
S3_BUCKET_NAME=whatbreaks-reports
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Sample Architecture Input

```
I have a web application running on EC2 instances behind an Application Load Balancer.
The database is RDS MySQL in a single AZ. Static assets are served from S3.
User sessions are stored in ElastiCache Redis (single node).
The application runs in us-east-1 and serves global customers.
```

## License

MIT
