# Progga AI — Frontend 🍌🤖

Next.js app for **Progga AI**, the AI tutor that helps kids *think*, not copy. For students from Class 3 to HSC, with parents, teachers and admins.

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

## Design

- Playful palette (grape, banana, mint) on a warm cream canvas; tokens live in `src/app/globals.css`.
- `src/components/brand/ProggaBot.tsx`: the animated robot mascot. Its eyes, brows and mouth morph smoothly between moods (idle, thinking, asking, happy, cheer, oops), and skins are bought with Kola coins 🍌.
- `src/components/brand/Logo.tsx` and `public/brand/`: robot-with-banana logo.
