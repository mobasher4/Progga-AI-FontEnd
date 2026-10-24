# Progga AI — Frontend 🍌🤖

Next.js app for **Progga AI**, the AI tutor that helps kids *think*, not copy. For students from Class 3 to SSC, with parents, teachers and admins.

Backend: [Progga-AI-Backend](https://github.com/mobasher4/Progga-AI-Backend)

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion · KaTeX · SWR

## Quick start

```bash
npm install
cp .env.example .env.local   # BACKEND_URL=http://localhost:4000
npm run dev                  # http://localhost:3000
```

The app proxies `/api/*` to `BACKEND_URL` (see `next.config.ts`), so the httpOnly auth cookie stays first-party. Start the backend first.

## What's inside

| Area | Pages |
|---|---|
| Public | Landing page, login (with demo-account buttons in dev), signup with class & language picker |
| Student | Home dashboard, **Ask Progga** (guided steps for problems, quick answers for facts), live tutor session with mission map & hints, video lessons with checkpoint questions, Quiz Arena, rewards (badges + robot-skin shop), weekly leaderboard, profile |
| Parent / teacher | Linked students, learning report (independence score, topics, misconceptions, safety alerts), read-only transcripts, daily limits |
| Admin | **AI settings**: choose provider + model, test it, switch live |

## Languages (English · বাংলা)

- The language switcher sits in every top bar (`src/components/LanguageSwitcher.tsx`). It changes the whole interface and the language Progga's AI replies in.
- UI strings live in `src/i18n/en.ts` and `src/i18n/bn.ts`. TypeScript requires `bn.ts` to have every key in `en.ts`. Use `const { t } = useT()` and `t("home.title")`; numbers render as Bangla digits in বাংলা.
- The choice is stored in a cookie (no flash on reload) and, when signed in, saved to the account, so the backend and the AI use it. If the student switches mid-session, the rest of the lesson plan is translated once so everything stays in one language.

## Design

- Playful palette (brand blue, banana, mint) on a warm cream canvas; tokens live in `src/app/globals.css`.
- `src/components/brand/ProggaBot.tsx`: the animated robot mascot. Its eyes, brows and mouth morph smoothly between moods (idle, thinking, asking, happy, cheer, oops), and skins are bought with Kola coins 🍌.
- `src/components/brand/Logo.tsx` and `public/brand/`: robot-with-banana logo.
