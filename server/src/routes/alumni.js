const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');

router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const all = await prisma.alumni.findMany({ take: 1000 });

    const scored = all.map(a => {
      let score = 0;
      if (profile?.school && a.school && a.school.toLowerCase() === profile.school.toLowerCase()) score += 3;
      if (profile?.location && a.location && a.location.toLowerCase() === profile.location.toLowerCase()) score += 1;
      if (profile?.major && a.program && a.program.toLowerCase().includes(profile.major.toLowerCase())) score += 1;
      return { ...a, score };
    }).sort((a,b)=>b.score-a.score).slice(0, 50);

    res.json(scored);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

// Search and filter alumni
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { query = '', industry = '', location = '', take = 50 } = req.query;
    
    // Use the search method from AlumniModel
    const results = await prisma.alumni.search({
      query: query.toString(),
      industry: industry.toString(),
      location: location.toString(),
      take: parseInt(take.toString()) || 50
    });

    res.json(results);
  } catch (e) {
    console.error('Alumni search error:', e);
    res.status(500).json({ error: 'Failed to search alumni' });
  }
});

// Get all alumni with basic filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const { take = 50 } = req.query;
    const alumni = await prisma.alumni.findMany({ 
      take: parseInt(take.toString()) || 50 
    });
    
    res.json(alumni);
  } catch (e) {
    console.error('Get alumni error:', e);
    res.status(500).json({ error: 'Failed to load alumni' });
  }
});

module.exports = router;
