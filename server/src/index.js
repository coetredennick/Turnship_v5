require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { prisma } = require('./db/prisma');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-not-secure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// DEV: Bypass auth by setting a mock user session
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (!req.session) {
      req.session = {};
    }
    if (!req.session.user) {
      req.session.user = {
        id: "dev-user-1",
        email: "dev@example.com",
        name: "Dev User"
      };
    }
    next();
  });
}
// Health
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Core routes
app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/connections', require('./routes/connections'));
app.use('/emails', require('./routes/emails'));
app.use('/timeline', require('./routes/timeline'));
app.use('/followups', require('./routes/followups'));
app.use('/analytics', require('./routes/analytics'));

// ---- API aliases expected by the design client ----
app.use('/api/connections', require('./routes/connections'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/profile', require('./routes/profile'));

app.get('/api/health', async (req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', timestamp: new Date().toISOString() }); }
  catch(e) { res.status(500).json({ status: 'error', error: e.message }); }
});

app.get('/api/user', async (req, res) => {
  if (!req.session?.user) return res.json({ user: null, profile: null });
  const profile = await prisma.profile.findUnique({ where: { userId: req.session.user.id } });
  res.json({ user: req.session.user, profile });
});

// Use enhanced analytics endpoint
app.use('/api/analytics', require('./routes/analytics'));
// ---- end API aliases ----

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
