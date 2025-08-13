const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');

// Get all follow-ups for a user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { status, includeConnection = true } = req.query;
    
    const where = { userId };
    if (status) where.status = status;
    
    const followups = await prisma.followup.findMany({
      where,
      include: includeConnection ? { connection: true } : {},
      orderBy: { dueAt: 'asc' }
    });
    
    res.json(followups);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// Get due and overdue follow-ups
router.get('/due', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const followups = await prisma.followup.findMany({
      where: {
        userId,
        status: 'scheduled',
        dueAt: { lte: tomorrow } // Due today or overdue
      },
      include: { connection: true },
      orderBy: { dueAt: 'asc' }
    });
    
    // Categorize follow-ups
    const categorized = followups.map(followup => {
      const dueAt = new Date(followup.dueAt);
      const diffMs = dueAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      let status, timeAgo, urgency;
      if (diffDays < 0) {
        status = 'overdue';
        timeAgo = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        urgency = 'high';
      } else if (diffDays === 0) {
        status = 'due';
        timeAgo = 'Due today';
        urgency = 'medium';
      } else {
        status = 'upcoming';
        timeAgo = 'Due tomorrow';
        urgency = 'low';
      }
      
      return {
        ...followup,
        status,
        timeAgo,
        urgency,
        diffDays
      };
    });
    
    res.json(categorized);
  } catch (error) {
    console.error('Error fetching due follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch due follow-ups' });
  }
});

// Create a new follow-up
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { connection_id, due_at, rule, note } = req.body || {};
    
    if (!connection_id || !due_at) {
      return res.status(400).json({ error: 'connection_id and due_at are required' });
    }
    
    const created = await prisma.followup.create({
      data: { 
        userId, 
        connectionId: connection_id, 
        dueAt: new Date(due_at), 
        rule: rule || null,
        note: note || null
      }
    });
    
    res.json(created);
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// Update a follow-up status
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    const { status } = req.body || {};
    
    const existing = await prisma.followup.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    
    const updated = await prisma.followup.update({ 
      where: { id }, 
      data: { 
        status,
        completedAt: status === 'completed' ? new Date() : null
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
});

// Delete a follow-up
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const id = req.params.id;
    
    const existing = await prisma.followup.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    
    await prisma.followup.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({ error: 'Failed to delete follow-up' });
  }
});

module.exports = router;
