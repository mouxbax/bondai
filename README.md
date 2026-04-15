# BondAI

BondAI is a mobile-first PWA that uses AI as a **bridge** toward real human connection: daily check-ins, social coaching roleplay, goals, and a connection score - with crisis-aware guardrails.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, shadcn-style Radix components, Framer Motion, Recharts
- Prisma + PostgreSQL (Supabase-compatible connection string)
- Auth.js (NextAuth v5) with Google OAuth and optional email (Nodemailer)
- OpenAI SDK pointed at [OpenRouter](https://openrouter.ai/)
- `next-pwa` for offline support (service worker disabled in local dev by default)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `OPENROUTER_API_KEY` at minimum. For Google sign-in, add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. For magic links, configure `EMAIL_SERVER` and `EMAIL_FROM`.

3. **Database**

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Development sign-in

When OAuth is **not** configured and `NODE_ENV` is `development`, a **Dev sign-in** provider is enabled. Use any valid email; the user is created on first login. For the seeded demo account, use `demo@bondai.app` after running `npm run db:seed`.

## Deployment (Vercel)

- Add the same environment variables in the Vercel project settings.
- Run `prisma generate` during build (handled by `package.json` `build` script and `vercel.json`).
- Point `NEXTAUTH_URL` at your production URL.

## Project structure

Key paths:

- `app/(app)/*` - authenticated shell (home, chat, coaching, goals, score)
- `app/api/*` - REST-style API routes (chat streaming, goals, score, crisis logging)
- `lib/ai/*` - OpenRouter client, prompts, emotion/crisis helpers
- `prisma/schema.prisma` - data model
- `public/manifest.json` - PWA manifest

## Safety

Crisis detection logs metadata **only to your database** when a risky user message is processed in **`POST /api/chat`** (and the conversation is flagged for a gentle follow-up on the next UTC day). The UI still shows helpline resources. It does **not** notify third parties - privacy is essential for trust. `POST /api/crisis` remains available if you need additional client-side logging.

## License

Private / all rights reserved unless you choose otherwise.
