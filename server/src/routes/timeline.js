const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');

// General timeline endpoint - returns recent events for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const events = await prisma.timelineEvent.findMany({
      where: { userId }, 
      orderBy: { at: 'desc' },
      take: 20 // Limit to last 20 events
    });
    res.json(events);
  } catch (error) {
    console.error('Timeline error:', error);
    res.json([]); // Return empty array if no events
  }
});

router.get('/:connectionId', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.connectionId;
  const events = await prisma.timelineEvent.findMany({
    where: { userId, connectionId: id }, orderBy: { at: 'desc' }
  });
  res.json(events);
});

module.exports = router;