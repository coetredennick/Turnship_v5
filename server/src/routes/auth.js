const router = require('express').Router();
const { google } = require('googleapis');
const { prisma } = require('../db/prisma');
const { setUserSession } = require('../middleware/auth');


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send']
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

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
  res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/onboarding?oauth_success=true');
});

router.get('/profile', async (req, res) => {
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
