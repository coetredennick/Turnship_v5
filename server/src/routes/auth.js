const router = require('express').Router();
const { prisma } = require('../db/prisma');
const { setUserSession } = require('../middleware/auth');

// Only initialize Google OAuth if credentials are available
let oauth2Client = null;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
  const { google } = require('googleapis');
  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

router.get('/google', (req, res) => {
  if (!oauth2Client) {
    console.error('Google OAuth not configured. Missing environment variables:', {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: !!process.env.GOOGLE_REDIRECT_URI
    });
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  // Set redirect URI for this flow
  oauth2Client.redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`;
  
  console.log('Generating OAuth URL with redirect URI:', oauth2Client.redirectUri);
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile']
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    if (!oauth2Client) {
      return res.status(500).send('Google OAuth not configured');
    }

    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    // Set the redirect URI for token exchange (needed for Replit)
    oauth2Client.redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback`;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const { google } = require('googleapis');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    const email = data.email;
    const name = data.name || email;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name }
    });

    await prisma.oAuthToken.upsert({
      where: { userId_provider: { userId: user.id, provider: 'google' } },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || null,
        scope: tokens.scope || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      create: {
        userId: user.id, provider: 'google',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || null,
        scope: tokens.scope || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });

    setUserSession(req, user);
    console.log('✅ User session set:', req.session.user);
    console.log('🔄 Redirecting to:', (process.env.CLIENT_URL || 'http://localhost:5173') + '/?auth_success=true');
    res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/?auth_success=true');
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

router.get('/user', async (req, res) => {
  console.log('🔍 Checking user session:', req.session?.user ? 'exists' : 'missing');
  if (!req.session?.user) return res.status(200).json({ user: null });
  const profile = await prisma.profile.findUnique({ where: { userId: req.session.user.id } });
  res.json({ user: req.session.user, profile });
});

// Development-only auth route
if (process.env.NODE_ENV === 'development') {
  router.post('/dev-login', (req, res) => {
    // Auto-login with dev user
    const devUser = {
      id: 'dev-user-1',
      email: 'dev@example.com',
      name: 'Dev User'
    };
    setUserSession(req, devUser);
    res.json({ success: true, user: devUser });
  });
}

module.exports = router;
