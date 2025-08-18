const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');
const { ALLOWED, isValidTransition, applyTransition, computeNextAction } = require('../services/flow');
const { validateStateMachine, ensureNextActionConsistency, logStateTransitions } = require('../middleware/stateMachineValidation');
const { optimisticLocking, checkConnectionVersion, withVersionIncrement, idempotencyMiddleware } = require('../middleware/concurrency');


router.get('/', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { query = '', stage, alumni } = req.query;
  const where = { userId };
  if (stage) where.stage = stage;
  if (alumni !== undefined) where.alumni = alumni === 'true';
  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { company: { contains: query, mode: 'insensitive' } },
      { role: { contains: query, mode: 'insensitive' } },
    ];
  }
  const list = await prisma.connection.findMany({
    where, orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

router.post('/', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const data = { ...req.body, userId, stage: req.body.stage || 'Not Contacted' };
  // Initialize authoritative state fields if not provided
  if (data.state === undefined) data.state = 'NOT_CONTACTED';
  if (data.cycle === undefined) data.cycle = 1;
  if (data.nextAction === undefined) data.nextAction = computeNextAction({ state: data.state, cycle: data.cycle });
  
  // Use upsert to handle duplicate emails gracefully
  if (data.email) {
    const result = await prisma.connection.upsert({
      where: { userId_email: { userId, email: data.email } },
      update: data,
      create: data
    });
    res.json(result);
  } else {
    const created = await prisma.connection.create({ data });
    res.json(created);
  }
});

router.put('/:id', requireAuth, validateStateMachine, ensureNextActionConsistency, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  const existing = await prisma.connection.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });
  // Whitelist only safe, non-flow fields
  const allowedKeys = ['fullName','email','company','role','location','tags','notes','alumni','school','gradYear'];
  const data = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowedKeys.includes(k)));
  if (data.email) data.email = String(data.email).toLowerCase().trim();
  const updated = await prisma.connection.update({ where: { id }, data });
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  const existing = await prisma.connection.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });
  await prisma.connection.delete({ where: { id } });
  res.json({ ok: true });
});

// Batch import (CSV/paste-grid -> array of rows)
router.post('/import', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const rows = Array.isArray(req.body) ? req.body : [];
  if (!rows.length) return res.status(400).json({ error: 'No rows' });
  let inserted = 0;
  for (const r of rows) {
    const email = (r.email || '').toLowerCase().trim();
    const data = {
      fullName: r.fullName ?? null,
      email: email || null,
      company: r.company ?? null,
      role: r.role ?? null,
      location: r.location ?? null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      notes: r.notes ?? null,
      alumni: !!r.alumni,
      school: r.school ?? null,
      gradYear: r.gradYear ? Number(r.gradYear) : null,
      stage: r.stage || 'Not Contacted'
    };
    try {
      if (email) {
        await prisma.connection.upsert({
          where: { userId_email: { userId, email } },
          update: data,
          create: { userId, ...data }
        });
      } else {
        await prisma.connection.create({ data: { userId, ...data } });
      }
      inserted++;
    } catch (e) {
      // keep going on per-row errors
    }
  }
  res.json({ inserted });
});

// Replace the entire POST /:id/advance-stage route with:
router.post('/:id/advance-stage', requireAuth, async (req, res) => {
  res.status(410).json({ 
    error: 'This endpoint has been removed. Use the state machine transition endpoint instead.',
    use: 'POST /api/connections/:id/transition',
    documentation: 'https://docs.yourapp.com/migration/state-machine',
    example: {
      endpoint: 'POST /api/connections/:id/transition',
      body: {
        action: 'START_DRAFTING',
        metadata: {}
      }
    }
  });
});

// Get connections with due follow-ups
router.get('/due-followups', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const now = new Date();
  
  const dueFollowups = await prisma.followup.findMany({
    where: {
      userId,
      status: 'scheduled',
      dueAt: { lte: now }
    },
    include: {
      connection: true
    },
    orderBy: { dueAt: 'asc' }
  });

  res.json(dueFollowups);
});

// Partial update (PATCH) for design client compatibility
router.patch('/:id', requireAuth, validateStateMachine, ensureNextActionConsistency, async (req, res) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  console.log(`PATCH /api/connections/${id} called by user ${userId}`);
  console.log('Request body:', req.body);
  
  try {
    const existing = await prisma.connection.findUnique({ where: { id } });
    console.log('Existing connection found:', !!existing);
    
    if (!existing || existing.userId !== userId) {
      console.log('Connection not found or unauthorized');
      return res.status(404).json({ error: 'Not found' });
    }
    
    const body = req.body || {};
    // Disallow state machine and stage fields here
    const { state, cycle, nextAction, nextActionAt, gmailThreadId, lastContactedAt, lastReplyAt, replySentiment, stage, stageStatus, currentDraftId, ...data } = body;
    if (data.email) data.email = String(data.email).toLowerCase().trim();
    
    console.log('Updating connection with data:', data);
    const updated = await prisma.connection.update({ where: { id }, data });
    console.log('Connection updated successfully');
    
    res.json(updated);
  } catch (error) {
    console.error('Error in PATCH connections:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/transition', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { action, metadata } = req.body || {};
  const conn = await prisma.connection.findUnique({ where: { id } });
  if (!conn || conn.userId !== req.session.user.id) return res.status(404).json({ error: 'Not found' });

  // Optimistic concurrency check
  if (metadata?.expectedVersion && conn.version !== metadata.expectedVersion) {
    return res.status(409).json({ error: 'Version conflict', currentVersion: conn.version, expectedVersion: metadata.expectedVersion });
  }

  if (!isValidTransition(conn.state, action)) {
    return res.status(422).json({ error: `Action ${action} not allowed from ${conn.state}`, allowed: ALLOWED[conn.state] ?? [] });
  }

  const data = await applyTransition(prisma, conn, action, metadata);
  const updated = await prisma.connection.update({ where: { id }, data: { ...data, version: { increment: 1 } } });

  await prisma.timelineEvent.create({
    data: { connectionId: id, userId: req.session.user.id, type: 'transition', meta: { from: conn.state, to: updated.state, action, metadata } }
  });

  res.json(updated);
});

module.exports = router;