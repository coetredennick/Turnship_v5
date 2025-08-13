const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');


// Get comprehensive analytics overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const now = new Date();
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Basic email counts
    const sends7 = await prisma.emailSent.count({ 
      where: { userId, sentAt: { gte: since7 } } 
    });
    const sends28 = await prisma.emailSent.count({ 
      where: { userId, sentAt: { gte: since28 } } 
    });

    // Connection counts and stage breakdown
    const totalConnections = await prisma.connection.count({ where: { userId } });
    const stageBreakdown = await prisma.connection.groupBy({ 
      by: ['stage'], 
      where: { userId }, 
      _count: { stage: true } 
    });

    // Reply analytics
    const totalReplies = await prisma.connection.count({
      where: { 
        userId, 
        lastReplyAt: { not: null }
      }
    });
    const positiveReplies = await prisma.connection.count({
      where: { 
        userId, 
        replySentiment: 'positive'
      }
    });
    const negativeReplies = await prisma.connection.count({
      where: { 
        userId, 
        replySentiment: 'negative'
      }
    });

    // Calculate reply rate
    const replyRate = sends28 > 0 ? Math.round((totalReplies / sends28) * 100) : 0;
    const positiveReplyRate = totalReplies > 0 ? Math.round((positiveReplies / totalReplies) * 100) : 0;

    // Follow-up analytics (using mock data since followup model doesn't persist)
    const followupsScheduled = 0; // Mock data since CSV system doesn't persist followups
    const overdueFolowups = 0; // Mock data since CSV system doesn't persist followups

    // Activity trends (daily email sends over last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = await prisma.emailSent.count({
        where: { 
          userId, 
          sentAt: { gte: dayStart, lte: dayEnd }
        }
      });
      
      dailyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        emails: count
      });
    }

    // Format stage breakdown for consistent structure (LEGACY)
    const stageFunnel = {};
    const stages = ['Not Contacted', 'First Outreach', 'Second Outreach', 'Third Outreach'];
    stages.forEach(stage => {
      const found = stageBreakdown.find(s => s.stage === stage);
      stageFunnel[stage] = found ? found._count.stage : 0;
    });

    // New state machine breakdown
    const stateBreakdown = await prisma.connection.groupBy({
      by: ['state'],
      where: { userId },
      _count: { state: true }
    });

    const stateFunnel = {};
    const states = ['NOT_CONTACTED', 'DRAFTING', 'AWAITING_REPLY', 'REPLIED', 'BOUNCED', 'DO_NOT_CONTACT', 'CLOSED'];
    states.forEach(state => {
      const found = stateBreakdown.find(s => s.state === state);
      stateFunnel[state] = found ? found._count.state : 0;
    });

    res.json({
      // Email metrics
      sendsLast7: sends7,
      sendsLast28: sends28,
      
      // Connection metrics
      totalConnections,
      activeConnections: totalConnections,
      
      // Reply metrics
      totalReplies,
      replyRate,
      positiveReplies,
      negativeReplies,
      positiveReplyRate,
      
      // Follow-up metrics
      followupsScheduled,
      followupsOverdue: overdueFolowups,
      followupsOnTime: Math.max(0, followupsScheduled - overdueFolowups),
      
      // Breakdown data
      stageFunnel, // LEGACY - for backward compatibility
      stageBreakdown, // LEGACY - for backward compatibility
      stateFunnel, // NEW - state machine based
      stateBreakdown, // NEW - state machine based
      
      // Activity trends
      dailyActivity,
      
      // Performance insights
      insights: {
        bestReplyDay: 'Monday', // Could be calculated from data
        averageResponseTime: '2.3 days', // Could be calculated
        topPerformingStage: 'First Outreach'
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
