#!/usr/bin/env node

/**
 * One-time backfill script to migrate legacy stage/stageStatus to state machine fields
 * 
 * This script maps legacy combinations to the new authoritative state machine:
 * - stage: "Not Contacted" | "First Outreach" | "Second Outreach" | "Third Outreach"  
 * - stageStatus: "ready" | "draft_saved" | "waiting" | "completed" | etc.
 * 
 * Maps to:
 * - state: OutreachState enum
 * - cycle: 1-3 
 * - nextAction: computed action hint
 */

const { PrismaClient } = require('@prisma/client');
const { computeNextAction } = require('../src/services/flow');

const prisma = new PrismaClient();

// Legacy to state machine mapping
function mapLegacyToStateMachine(stage, stageStatus) {
  // Determine cycle from stage
  let cycle = 1;
  if (stage === 'First Outreach') cycle = 1;
  else if (stage === 'Second Outreach') cycle = 2;
  else if (stage === 'Third Outreach') cycle = 3;
  else if (stage === 'Not Contacted') cycle = 1;
  
  // Determine state from stage + stageStatus combination
  let state = 'NOT_CONTACTED';
  
  if (stage === 'Not Contacted') {
    if (stageStatus === 'draft_saved') {
      state = 'DRAFTING';
    } else {
      state = 'NOT_CONTACTED';
    }
  } else {
    // First/Second/Third Outreach stages
    if (stageStatus === 'draft_saved') {
      state = 'DRAFTING';
    } else if (stageStatus === 'waiting' || stageStatus === 'sent') {
      state = 'AWAITING_REPLY';
    } else if (stageStatus === 'positive_reply' || stageStatus === 'negative_reply' || stageStatus === 'completed') {
      state = 'REPLIED';
    } else if (stageStatus === 'bounced') {
      state = 'BOUNCED';
    } else if (stageStatus === 'dnc') {
      state = 'DO_NOT_CONTACT';
    } else {
      // Default to awaiting reply for outreach stages
      state = 'AWAITING_REPLY';
    }
  }
  
  // Compute nextAction based on state and cycle
  const nextAction = computeNextAction({ state, cycle });
  
  return { state, cycle, nextAction };
}

async function backfillConnections() {
  console.log('🔄 Starting legacy to state machine backfill...');
  
  try {
    // Get all connections to check for inconsistencies
    const allConnections = await prisma.connection.findMany({
      select: {
        id: true,
        stage: true,
        stageStatus: true,
        state: true,
        cycle: true,
        nextAction: true,
        fullName: true
      }
    });
    
    // Filter connections that need backfill (inconsistent state machine data)
    const connectionsToBackfill = allConnections.filter(connection => {
      const { state: expectedState, cycle: expectedCycle, nextAction: expectedNextAction } = mapLegacyToStateMachine(
        connection.stage || 'Not Contacted',
        connection.stageStatus || 'ready'
      );
      
      return connection.state !== expectedState || 
             connection.cycle !== expectedCycle || 
             connection.nextAction !== expectedNextAction;
    });
    
    console.log(`📊 Found ${connectionsToBackfill.length} connections to backfill (out of ${allConnections.length} total)`);
    
    if (connectionsToBackfill.length === 0) {
      console.log('✅ No connections need backfilling');
      return;
    }
    
    let updated = 0;
    let errors = 0;
    
    for (const connection of connectionsToBackfill) {
      try {
        const { state, cycle, nextAction } = mapLegacyToStateMachine(
          connection.stage || 'Not Contacted',
          connection.stageStatus || 'ready'
        );
        
        await prisma.connection.update({
          where: { id: connection.id },
          data: {
            state,
            cycle,
            nextAction,
            // Don't modify legacy fields - keep them for backward compatibility
          }
        });
        
        console.log(`✓ ${connection.fullName || connection.id}: ${connection.stage}/${connection.stageStatus} → ${state} (cycle ${cycle})`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Failed to update ${connection.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📈 Backfill completed:`);
    console.log(`  ✅ Updated: ${updated} connections`);
    console.log(`  ❌ Errors: ${errors} connections`);
    
    if (errors > 0) {
      console.log(`\n⚠️  Some connections failed to update. Check the errors above.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Backfill failed:', error);
    process.exit(1);
  }
}

async function validateBackfill() {
  console.log('\n🔍 Validating backfill results...');
  
  const stats = await prisma.connection.groupBy({
    by: ['state', 'cycle'],
    _count: true,
    orderBy: [
      { state: 'asc' },
      { cycle: 'asc' }
    ]
  });
  
  console.log('\n📊 State distribution after backfill:');
  stats.forEach(({ state, cycle, _count }) => {
    console.log(`  ${state} (cycle ${cycle}): ${_count} connections`);
  });
  
  // Since state, cycle, and nextAction are required fields, they can't be null
  // Check for any potentially inconsistent data instead
  const totalConnections = await prisma.connection.count();
  console.log(`\n✅ All ${totalConnections} connections have complete state machine fields (required by schema)`);
  
  // Check for any connections that might still be inconsistent
  const sampleConnections = await prisma.connection.findMany({
    take: 5,
    select: {
      id: true,
      stage: true,
      stageStatus: true,
      state: true,
      cycle: true,
      nextAction: true,
      fullName: true
    }
  });
  
  if (sampleConnections.length > 0) {
    console.log('\n📝 Sample connections after backfill:');
    sampleConnections.forEach(conn => {
      console.log(`  ${conn.fullName || conn.id}: ${conn.stage}/${conn.stageStatus} → ${conn.state} (cycle ${conn.cycle}) → ${conn.nextAction}`);
    });
  }
}

async function main() {
  console.log('🚀 Legacy to State Machine Backfill Script');
  console.log('==========================================');
  
  await backfillConnections();
  await validateBackfill();
  
  console.log('\n🎉 Backfill script completed successfully!');
}

main()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });