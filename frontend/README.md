# WhatBreaks Frontend

Next.js web application for the WhatBreaks pre-mortem engine.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI Integration**: Amazon Bedrock / OpenAI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Configuration

Create `.env.local`:

```env
# AI Provider (choose one)
OPENAI_API_KEY=sk-your-openai-key

# OR use Amazon Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Optional: Backend API (for production)
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # Landing page
│   │   ├── layout.tsx      # Root layout
│   │   ├── globals.css     # Global styles
│   │   ├── analyze/        # Pre-mortem generation page
│   │   ├── dashboard/      # Results dashboard
│   │   └── api/            # API routes (dev mode)
│   │       ├── premortem/  # Pre-mortem generation endpoint
│   │       └── generate-pdf/ # PDF generation endpoint
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── ai/            # AI integration
│   │   │   ├── bedrock.ts # Amazon Bedrock client
│   │   │   └── analyzer.ts # OpenAI fallback
│   │   ├── pdf/           # PDF generation
│   │   │   └── generator.ts
│   │   └── utils.ts       # Utilities
│   └── types/
│       └── index.ts       # TypeScript types
├── public/                # Static assets
├── .env.local            # Environment variables (create this)
├── .env.example          # Environment template
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Features

### Pages

- **Landing Page** (`/`): Introduction and CTA
- **Analyze** (`/analyze`): Submit infrastructure changes
- **Dashboard** (`/dashboard`): View pre-mortem results

### API Routes (Development Mode)

When running locally, the frontend includes API routes:

- `POST /api/premortem`: Generate pre-mortem report
- `POST /api/generate-pdf`: Generate PDF report

In production, these are replaced by Lambda functions.

## Development Modes

### Local Development (No AWS)

Use OpenAI as the AI provider:

```env
OPENAI_API_KEY=sk-your-key
```

The app will use Next.js API routes with OpenAI.

### Local Development (With AWS)

Use Amazon Bedrock locally:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

The app will use Next.js API routes with Bedrock.

### Production Mode

Point to deployed Lambda backend:

```env
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```

The app will call Lambda functions instead of local API routes.

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import to Vercel**
3. **Set environment variables** in Vercel dashboard
4. **Deploy**

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### AWS Amplify

1. **Connect GitHub repository**
2. **Set build settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
3. **Set environment variables**
4. **Deploy**

### Docker

```bash
docker build -t whatbreaks-frontend .
docker run -p 3000:3000 whatbreaks-frontend
```

## Environment Variables

### Required

- `OPENAI_API_KEY` OR `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

### Optional

- `NEXT_PUBLIC_API_URL`: Backend API endpoint (production)
- `NEXT_PUBLIC_APP_URL`: Frontend URL (for metadata)
- `AWS_REGION`: AWS region (default: us-east-1)

## Testing

```bash
# Run tests (when added)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Styling

Uses Tailwind CSS with custom configuration:

- Dark mode support
- Custom color palette
- Responsive design
- Accessibility-first

## Components

Built with shadcn/ui:

- Button
- Card
- Input
- Textarea
- Select

Add more components:

```bash
npx shadcn-ui@latest add [component-name]
```

## Performance

- Server-side rendering (SSR)
- Static generation where possible
- Image optimization
- Code splitting
- Lazy loading

## Security

- Environment variables never exposed to client
- API routes validate input
- CORS configured properly
- No sensitive data in client code

## Troubleshooting

### Module not found errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors

```bash
npm run build
# Check for TypeScript errors
```

### API connection issues

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in API Gateway
- Verify Lambda function is deployed

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## License

MIT
