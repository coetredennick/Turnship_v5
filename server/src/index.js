require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { prisma } = require('./db/prisma');

// PostgreSQL session store for production
let PgSession;
if (process.env.NODE_ENV === 'production') {
  try {
    PgSession = require('connect-pg-simple')(session);
    console.log('✅ PostgreSQL session store configured');
  } catch (error) {
    console.warn('PostgreSQL session store not available:', error.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configure CORS for Replit
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // In production on Replit, allow the Replit domain
    if (process.env.REPL_OWNER && process.env.REPL_SLUG) {
      const allowedOrigins = [
        CLIENT_URL,
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:3000`
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in Replit for now
      }
    } else {
      // Local development
      callback(null, true);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Session configuration with Redis store for production
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for Replit compatibility
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests for OAuth
  }
};

// Use PostgreSQL store in production if available
if (process.env.NODE_ENV === 'production' && PgSession) {
  sessionConfig.store = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session'
  });
  console.log('✅ Using PostgreSQL session store');
} else {
  console.log('⚠️  Using MemoryStore (not recommended for production)');
}

app.use(session(sessionConfig));

// Note: Using ReplitAuth for authentication - no dev bypass needed
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
app.use('/api/auth', require('./routes/auth'));
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

// Serve static files from the React app build
const path = require('path');
const clientBuildPath = path.join(__dirname, '../../client/dist');

// Serve static files
app.use(express.static(clientBuildPath));

// Catch all handler for React Router
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));