# Turnship v3 — Ready-to-Run Repo

This repo combines the **lean Express/Prisma server** with the **Replit design UI**.

## Run locally

### 1) Server
```bash
cd server
cp .env.example .env  # fill in DATABASE_URL, GOOGLE_* keys, SESSION_SECRET
npm i
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 2) Client
```bash
cd ../client
cp .env.example .env  # VITE_API_URL=http://localhost:3001/api
npm i
npm run dev
```

Open http://localhost:5173

## Deploy
- FE: `npm run build` then deploy `client/dist` to Netlify/Vercel.
- API: `npm run start` on Render/Railway. Set envs from `server/.env.example`.
