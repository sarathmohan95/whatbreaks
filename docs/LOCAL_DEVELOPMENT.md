# Local Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **AWS Account** (optional for Phase 1, required for full features)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cloudreliant-ai
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- Tailwind CSS
- OpenAI SDK
- AWS SDK
- jsPDF
- UI components

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Optional (for full features)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_TABLE_NAME=cloudreliant-analyses
S3_BUCKET_NAME=cloudreliant-reports

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
cloudreliant-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── analyze/           # Analysis page
│   │   │   └── page.tsx
│   │   ├── dashboard/         # Results page
│   │   │   └── page.tsx
│   │   └── api/               # API routes
│   │       ├── analyze/
│   │       │   └── route.ts
│   │       └── generate-pdf/
│   │           └── route.ts
│   ├── components/            # React components
│   │   └── ui/               # UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       └── textarea.tsx
│   ├── lib/                   # Utilities
│   │   ├── ai/
│   │   │   └── analyzer.ts   # AI analysis logic
│   │   ├── pdf/
│   │   │   └── generator.ts  # PDF generation
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript types
│       └── index.ts
├── docs/                      # Documentation
├── public/                    # Static assets
├── .env.example              # Environment template
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit files in `src/`
   - Hot reload will update the browser automatically

3. **Test your changes**
   - Visit affected pages
   - Test API endpoints
   - Check console for errors

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Testing the Application

#### Test Landing Page
1. Visit [http://localhost:3000](http://localhost:3000)
2. Verify all sections load correctly
3. Click "Analyze Architecture" button

#### Test Analysis Flow
1. Go to [http://localhost:3000/analyze](http://localhost:3000/analyze)
2. Enter sample architecture (see `docs/SAMPLE_INPUT.md`)
3. Select services
4. Choose region and criticality
5. Click "Analyze Architecture"
6. Wait for analysis to complete

#### Test Results Dashboard
1. After analysis completes, verify redirect to dashboard
2. Check overall score displays correctly
3. Verify score breakdown shows all categories
4. Review risk cards for proper formatting
5. Test "Download Report" button

#### Test PDF Generation
1. Click "Download Report" on dashboard
2. Verify PDF downloads
3. Open PDF and check formatting
4. Verify all sections are present

### API Testing

#### Test Analysis Endpoint

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Web app on EC2 with RDS in single AZ",
    "services": ["EC2", "RDS", "ALB"],
    "region": "us-east-1",
    "criticality": "High"
  }'
```

Expected response:
```json
{
  "id": "analysis-...",
  "timestamp": "2026-02-16T...",
  "input": {...},
  "score": {...},
  "risks": [...],
  "summary": "..."
}
```

## Common Development Tasks

### Adding a New Page

1. Create file in `src/app/your-page/page.tsx`
2. Export default component
3. Add navigation link if needed

Example:
```typescript
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}
```

### Adding a New API Route

1. Create file in `src/app/api/your-route/route.ts`
2. Export HTTP method handlers

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  return NextResponse.json({ success: true });
}
```

### Adding a New Component

1. Create file in `src/components/YourComponent.tsx`
2. Export component
3. Import and use in pages

Example:
```typescript
export function YourComponent({ prop }: { prop: string }) {
  return <div>{prop}</div>;
}
```

### Modifying AI Prompt

1. Edit `src/lib/ai/analyzer.ts`
2. Update `ANALYSIS_PROMPT` constant
3. Test with sample inputs
4. See `docs/AI_PROMPT.md` for details

### Styling Changes

1. Edit component-level styles using Tailwind classes
2. Modify global styles in `src/app/globals.css`
3. Update theme in `tailwind.config.ts`

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### OpenAI API Errors

- Verify API key is correct
- Check API key has credits
- Review rate limits
- Check network connectivity

### Build Errors

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Clean build
rm -rf .next
npm run build
```

### Environment Variables Not Loading

- Ensure `.env.local` exists
- Restart development server
- Check variable names match exactly
- Don't commit `.env.local` to Git

## Performance Tips

### Optimize Development Experience

1. **Use Fast Refresh**
   - Save files to see instant updates
   - Preserves component state

2. **Enable TypeScript Strict Mode**
   - Catch errors early
   - Better IDE support

3. **Use React DevTools**
   - Install browser extension
   - Debug component hierarchy

### Optimize Build Performance

1. **Minimize Dependencies**
   - Only import what you need
   - Use tree-shaking

2. **Code Splitting**
   - Use dynamic imports
   - Lazy load components

3. **Image Optimization**
   - Use Next.js Image component
   - Optimize image sizes

## Debugging

### Browser DevTools

1. Open DevTools (F12)
2. Check Console for errors
3. Use Network tab for API calls
4. Use React DevTools for components

### VS Code Debugging

1. Install "Debugger for Chrome" extension
2. Add launch configuration
3. Set breakpoints
4. Start debugging (F5)

### API Debugging

Add console logs in API routes:

```typescript
export async function POST(request: NextRequest) {
  console.log('Request received:', await request.json());
  // ... rest of code
}
```

## Best Practices

1. **Code Style**
   - Use TypeScript for type safety
   - Follow ESLint rules
   - Use Prettier for formatting

2. **Component Design**
   - Keep components small and focused
   - Use composition over inheritance
   - Extract reusable logic

3. **State Management**
   - Use React hooks
   - Keep state close to where it's used
   - Consider context for global state

4. **Error Handling**
   - Always handle API errors
   - Show user-friendly messages
   - Log errors for debugging

## Getting Help

- Check documentation in `docs/`
- Review sample inputs in `docs/SAMPLE_INPUT.md`
- Check GitHub issues
- Review Next.js documentation
- Check OpenAI API documentation

## Next Steps

After setting up local development:

1. Review `docs/ARCHITECTURE.md` for system overview
2. Read `docs/AI_PROMPT.md` to understand AI analysis
3. Try sample inputs from `docs/SAMPLE_INPUT.md`
4. Review `docs/DEPLOYMENT.md` for production deployment
