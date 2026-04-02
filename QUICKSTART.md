# Quick Start Guide

## Get Started in 3 Steps

### Step 1: Configure Environment
```bash
# Edit .env.local with your credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
```

### Step 2: Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 3: Open in VS Code
```bash
code .
```

## Project Structure At A Glance

```text
app/            <- Pages and API routes
components/     <- Reusable UI components
lib/            <- Utility functions
hooks/          <- Custom React hooks
src/lib/ai/     <- AI orchestration, providers, and policies
src/types/      <- Shared AI and dossier types
config/         <- App configuration
```

Read `STRUCTURE.md` for more detailed architecture guidance.

## Available Commands

```bash
npm run dev
npm run build
npm start
```

## Key Files

- `STRUCTURE.md` - Architecture guide
- `SETUP_COMPLETE.md` - Setup summary
- `config/index.ts` - App configuration
- `src/types/ai.ts` - Shared dossier and intake types
- `.env.example` - Environment variables template

## Next Steps

1. Configure Supabase credentials.
2. Continue building features on top of the existing `src/lib/ai/` architecture.
3. Add UI and route work under `components/` and `app/`.

## Checklist Before Development

- [ ] Read `STRUCTURE.md`
- [ ] Configure `.env.local`
- [ ] Run `npm run dev` successfully
- [ ] Verify the app loads at `http://localhost:3000`
- [ ] Review `src/lib/ai/` and `src/types/ai.ts`

## Tips

1. Use the `@/` alias for imports.
2. Keep UI in components and AI logic in `src/lib/ai/`.
3. Use `src/types/ai.ts` for dossier and intake types.
4. Prefer small, focused modules.

## Troubleshooting

If TypeScript errors look stale, restart the TypeScript server in VS Code and rerun:

```bash
npx tsc --noEmit --pretty false
```

If dev artifacts seem stale, stop the dev server, clear `.next`, and start it again.

