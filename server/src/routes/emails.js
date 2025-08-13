const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { prisma } = require('../db/prisma');
const { generateDraft } = require('../services/email');
const { sendEmail, checkForReplies, analyzeReplySentiment } = require('../services/gmail');
const transition = async (id, action, metadata={}) => {
  return await prisma.$transaction(async (tx) => {
    const conn = await tx.connection.findUnique({ where: { id } });
    const data = await require('../services/flow').applyTransition(tx, conn, action, metadata);
    return tx.connection.update({ where: { id }, data });
  });
};


router.post('/generate', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { connection_id, purpose, tone, length } = req.body || {};
  const connection = await prisma.connection.findFirst({ where: { id: connection_id, userId }, });
  if (!connection || connection.userId !== userId) return res.status(404).json({ error: 'Not found' });

  const student = await prisma.profile.findUnique({ where: { userId } });
  
  // Get previous email if this is a follow-up
  let previousEmail = null;
  if (connection.stage !== 'Not Contacted') {
    const lastSent = await prisma.emailSent.findFirst({
      where: { userId, connectionId: connection_id },
      orderBy: { sentAt: 'desc' }
    });
    if (lastSent) {
      previousEmail = { subject: lastSent.subject, sentAt: lastSent.sentAt };
    }
  }
  
  const draft = await generateDraft({ 
    student, 
    connection, 
    purpose, 
    tone, 
    length,
    stage: connection.stage,
    previousEmail
  });

  const saved = await prisma.draft.create({
    data: {
      userId, connectionId: connection_id,
      subject: draft.subject || 'Hello',
      body: draft.body || '',
      meta: draft
    }
  });

  await transition(connection_id, "START_DRAFTING", { draftId: saved.id });

  await prisma.timelineEvent.create({
    data: {
      userId, connectionId: connection_id,
      kind: 'draft_generated',
      title: draft.subject || 'Draft generated',
      details: { purpose, tone, length }
    }
  });

  res.json(saved);
});

router.post('/send', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { draft_id } = req.body || {};
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  // Require idempotency key for SEND_EMAIL
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'x-idempotency-key header required for send operations' });
  }
  
  const draft = await prisma.draft.findUnique({ where: { id: draft_id }, include: { connection: true } });
  if (!draft || draft.userId !== userId) return res.status(404).json({ error: 'Not found' });
  if (!draft.connection?.email) return res.status(400).json({ error: 'Connection missing email' });

  // Check for duplicate send attempt
  const existingSend = await prisma.emailSent.findUnique({
    where: {
      userId_idempotencyKey: {
        userId,
        idempotencyKey
      }
    }
  });
  
  if (existingSend) {
    console.log(`Duplicate send attempt detected for key ${idempotencyKey}, returning cached result`);
    return res.json({ ok: true, gmailMessageId: existingSend.gmailMessageId, cached: true });
  }

  const r = await sendEmail({ userId, to: draft.connection.email, subject: draft.subject || 'Hello', body: draft.body || '' });

  await prisma.emailSent.create({
    data: {
      userId, connectionId: draft.connectionId,
      gmailMessageId: r.gmailMessageId,
      subject: draft.subject, body: draft.body,
      idempotencyKey
    }
  });

  await prisma.draft.update({ where: { id: draft_id }, data: { status: 'sent' } });
  
  await transition(draft.connectionId, "SEND_EMAIL", { gmailThreadId: r.gmailMessageId, replyWindowDays: 5 });

  // Create followup for all sent emails
  if (true) { // Always create followup when sending email
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 days
    
    await prisma.followup.create({
      data: {
        userId,
        connectionId: draft.connectionId,
        dueAt: followUpDate,
        rule: 'auto_follow_up'
      }
    });
  }

  await prisma.timelineEvent.create({
    data: {
      userId, connectionId: draft.connectionId,
      kind: 'email_sent', title: draft.subject || 'Email sent', details: { gmailMessageId: r.gmailMessageId }
    }
  });

  res.json({ ok: true, gmailMessageId: r.gmailMessageId });
});

// Batch email generation endpoint
router.post('/batch-generate', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { connection_ids, purpose, tone = 'warm', length = 'medium' } = req.body || {};
  
  if (!connection_ids || !Array.isArray(connection_ids) || connection_ids.length === 0) {
    return res.status(400).json({ error: 'connection_ids array is required' });
  }
  
  const student = await prisma.profile.findUnique({ where: { userId } });
  const results = [];
  const errors = [];
  
  // Process each connection
  for (const connectionId of connection_ids) {
    try {
      const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
      
      if (!connection || connection.userId !== userId) {
        errors.push({ connectionId, error: 'Connection not found' });
        continue;
      }
      
      // Get previous email if this is a follow-up
      let previousEmail = null;
      if (connection.stage !== 'Not Started') {
        const lastSent = await prisma.emailSent.findFirst({
          where: { userId, connectionId },
          orderBy: { sentAt: 'desc' }
        });
        if (lastSent) {
          previousEmail = { subject: lastSent.subject, sentAt: lastSent.sentAt };
        }
      }
      
      // Generate draft
      const draft = await generateDraft({ 
        student, 
        connection, 
        purpose, 
        tone, 
        length,
        stage: connection.stage,
        previousEmail
      });
      
      // Save draft
      const saved = await prisma.draft.create({
        data: {
          userId,
          connectionId,
          subject: draft.subject || 'Hello',
          body: draft.body || '',
          meta: draft
        }
      });
      
      await transition(connectionId, "START_DRAFTING", { draftId: saved.id });
      
      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          userId,
          connectionId,
          kind: 'draft_generated',
          title: `Batch draft: ${draft.subject || 'Draft generated'}`,
          details: { purpose, tone, length, batch: true }
        }
      });
      
      results.push({
        connectionId,
        draftId: saved.id,
        subject: saved.subject,
        body: saved.body,
        connection: {
          name: connection.fullName,
          company: connection.company
        }
      });
      
    } catch (error) {
      console.error(`Error generating draft for ${connectionId}:`, error);
      errors.push({ 
        connectionId, 
        error: error.message || 'Failed to generate draft' 
      });
    }
  }
  
  res.json({
    success: results.length,
    failed: errors.length,
    results,
    errors,
    summary: `Generated ${results.length} of ${connection_ids.length} drafts`
  });
});

// Get all drafts for a user
router.get('/drafts', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { status, connectionId } = req.query;
  
  const where = { userId };
  if (status) where.status = status;
  if (connectionId) where.connectionId = connectionId;
  
  const drafts = await prisma.draft.findMany({
    where,
    include: { connection: true },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(drafts);
});

// Update a draft
router.put('/drafts/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;
  const { subject, body } = req.body;
  
  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || draft.userId !== userId) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  
  const updated = await prisma.draft.update({
    where: { id },
    data: { 
      subject: subject || draft.subject,
      body: body || draft.body,
      meta: { ...draft.meta, edited: true, editedAt: new Date() }
    }
  });
  
  // Ensure connection is in DRAFTING state when draft is saved
  if (draft.connectionId) {
    const connection = await prisma.connection.findUnique({ where: { id: draft.connectionId } });
    
    // Only transition if not already drafting
    if (connection && connection.state !== 'DRAFTING') {
      await transition(draft.connectionId, "START_DRAFTING", { draftId: draft.id });
    }
  }
  
  res.json(updated);
});

// Delete a draft
router.delete('/drafts/:id', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { id } = req.params;
  
  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || draft.userId !== userId) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  
  // If this was the current draft for a connection, update the connection
  if (draft.status === 'draft' && draft.connectionId) {
    await prisma.connection.update({
      where: { id: draft.connectionId },
      data: { 
        stageStatus: 'ready',
        currentDraftId: null
      }
    });
  }
  
  await prisma.draft.delete({ where: { id } });
  res.json({ success: true });
});

// Delete all drafts for a connection (used for reset)
router.delete('/drafts/connection/:connectionId', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { connectionId } = req.params;
  
  try {
    // Verify the connection belongs to the user
    const connection = await prisma.connection.findUnique({ 
      where: { id: connectionId } 
    });
    
    if (!connection || connection.userId !== userId) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    // Delete all drafts for this connection
    const deletedDrafts = await prisma.draft.deleteMany({
      where: { 
        connectionId,
        userId 
      }
    });
    
    res.json({ 
      success: true, 
      deletedCount: deletedDrafts.count 
    });
  } catch (error) {
    console.error('Failed to delete drafts for connection:', error);
    res.status(500).json({ error: 'Failed to delete drafts' });
  }
});

// Check for replies and update connection statuses
router.post('/check-replies', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  
  try {
    const replies = await checkForReplies(userId);
    const updates = [];
    
    for (const reply of replies) {
      // Find the connection by email
      const connection = await prisma.connection.findFirst({
        where: { 
          userId, 
          email: reply.from 
        }
      });
      
      if (connection) {
        // Update connection with reply info using state machine
        const sentiment = analyzeReplySentiment(reply.snippet);
        
        await transition(connection.id, "REPLY_RECEIVED", { sentiment });
        
        // Create timeline event
        await prisma.timelineEvent.create({
          data: {
            userId,
            connectionId: connection.id,
            kind: 'reply_received',
            title: `Reply received: ${sentiment} sentiment`,
            details: { 
              subject: reply.subject,
              snippet: reply.snippet,
              sentiment,
              messageId: reply.messageId
            }
          }
        });
        
        updates.push({
          connectionId: connection.id,
          connectionName: connection.fullName,
          sentiment,
          subject: reply.subject
        });
      }
    }
    
    res.json({
      found: replies.length,
      processed: updates.length,
      updates,
      summary: `Found ${replies.length} replies, processed ${updates.length} connections`
    });
    
  } catch (error) {
    console.error('Error checking replies:', error);
    res.status(500).json({ error: 'Failed to check replies' });
  }
});

// Simulate receiving replies for testing (development only)
router.post('/simulate-replies', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  
  const userId = req.session.user.id;
  const { connectionIds = [], forceReply = false } = req.body;
  
  try {
    const updates = [];
    
    // If specific connections provided, simulate replies for those
    const connectionsToProcess = connectionIds.length > 0 
      ? await prisma.connection.findMany({
          where: { id: { in: connectionIds }, userId }
        })
      : await prisma.connection.findMany({
          where: { 
            userId,
            stage: { in: ['Not Contacted', 'First Outreach', 'Second Outreach', 'Third Outreach'] },
            stageStatus: { in: ['sent', 'waiting'] }
          },
          take: 3 // Limit to 3 for realistic simulation
        });
    
    for (const connection of connectionsToProcess) {
      // Simulate reply probability: 30% positive, 15% negative, 55% no reply
      const random = Math.random();
      let sentiment = null;
      let snippet = '';
      
      if (forceReply || random < 0.45) { // 45% chance of reply when forced or randomly
        if (random < 0.30) {
          sentiment = 'positive';
          snippet = `Thanks for reaching out! I'd be happy to share my experience at ${connection.company}. Let's schedule a call!`;
        } else {
          sentiment = 'negative';
          snippet = `I appreciate you reaching out, but I'm pretty busy right now. Maybe in a few months?`;
        }
        
        // Update connection using state machine
        await transition(connection.id, "REPLY_RECEIVED", { sentiment });
        
        // Create timeline event
        await prisma.timelineEvent.create({
          data: {
            userId,
            connectionId: connection.id,
            kind: 'reply_received',
            title: `Simulated reply: ${sentiment} sentiment`,
            details: { 
              subject: `Re: Outreach to ${connection.fullName}`,
              snippet,
              sentiment,
              messageId: `sim_reply_${Date.now()}`,
              simulated: true
            }
          }
        });
        
        updates.push({
          connectionId: connection.id,
          connectionName: connection.fullName,
          sentiment,
          snippet
        });
      }
    }
    
    res.json({
      simulated: true,
      processed: connectionsToProcess.length,
      repliesReceived: updates.length,
      updates,
      summary: `Simulated replies for ${connectionsToProcess.length} connections, ${updates.length} replied`
    });
    
  } catch (error) {
    console.error('Error simulating replies:', error);
    res.status(500).json({ error: 'Failed to simulate replies' });
  }
});

module.exports = router;