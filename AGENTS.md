# AGENTS.md — No‑BS Build Guide for Turnship v3

Prime directive: Ship a delightful, dead‑simple networking app for students in ≤ 2 weeks.
**UX over everything.** No new infra unless it directly improves today’s user flow.

**Golden rules:** simplest thing that works; one feature per PR; show UI in every PR; ask after 30m stuck; prefer deletion over abstraction; no silent scope creep; API p50 <150ms; draft p50 <4s.

**Stack:** React + Vite + Tailwind (light shadcn) • Express + Prisma + Postgres • Google OAuth + Gmail send • OpenAI for drafts.

**Explicitly NOT in v3.0:** no websockets, queues, Redis, GraphQL, job runners, LinkedIn scraping, calendar. No new deps without approval.

**Definition of done:** New user → Google sign‑in → profile → upload resume → add 5 connections → Generate & Send → timeline updates → follow‑up appears on Agenda — all in ≤ 10 minutes.
