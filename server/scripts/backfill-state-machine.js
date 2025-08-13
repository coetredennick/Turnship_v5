#!/usr/bin/env node

/**
 * State Machine Data Backfill Script
 * 
 * Migrates existing connections from legacy stage/stageStatus system
 * to the new state machine (state, cycle, nextAction).
 * 
 * USAGE:
 *   node scripts/backfill-state-machine.js [--dry-run] [--batch-size=100]
 * 
 * OPTIONS:
 *   --dry-run     Preview changes without applying them
 *   --batch-size  Number of connections to process per batch (default: 100)
 */

const { PrismaClient } = require('@prisma/client');
const { computeNextAction } = require('../src/services/flow');

const prisma = new PrismaClient();

// Command line argument parsing
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

console.log(`🚀 State Machine Backfill Script`);
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
console.log(`Batch Size: ${batchSize}`);
console.log(`Started: ${new Date().toISOString()}\n`);

// Legacy stage to new state mapping
const STAGE_TO_STATE_MAPPING = {
  'Not Contacted': { state: 'NOT_CONTACTED', cycle: 1 },
  'Not Started': { state: 'NOT_CONTACTED', cycle: 1 },
  'First Outreach': { state: 'AWAITING_REPLY', cycle: 1 },
  'Second Outreach': { state: 'AWAITING_REPLY', cycle: 2 },
  'Third Outreach': { state: 'AWAITING_REPLY', cycle: 3 },
  'Responded': { state: 'REPLIED', cycle: 1 },
  'Closed': { state: 'CLOSED', cycle: 1 }
};

// StageStatus refinements
const STATUS_REFINEMENTS = {
  'draft_saved': 'DRAFTING',
  'waiting': 'AWAITING_REPLY',
  'awaiting_reply': 'AWAITING_REPLY',
  'positive_reply': 'REPLIED',
  'negative_reply': 'REPLIED',
  'sent': 'AWAITING_REPLY',
  'ready': null // Use stage mapping
};

function mapLegacyToState(stage, stageStatus, lastReplyAt) {
  // Check if reply received overrides everything
  if (lastReplyAt) {
    return { state: 'REPLIED', cycle: 1 };
  }

  // Check status-based refinements first
  if (stageStatus && STATUS_REFINEMENTS[stageStatus]) {
    const refinedState = STATUS_REFINEMENTS[stageStatus];
    if (refinedState) {
      const baseMapping = STAGE_TO_STATE_MAPPING[stage] || { state: 'NOT_CONTACTED', cycle: 1 };
      return { state: refinedState, cycle: baseMapping.cycle };
    }
  }

  // Fall back to stage mapping
  return STAGE_TO_STATE_MAPPING[stage] || { state: 'NOT_CONTACTED', cycle: 1 };
}

function computeFollowupCount(stage, stageStatus) {
  // Estimate follow-up count based on legacy data
  if (stageStatus === 'awaiting_reply' || stageStatus === 'waiting') {
    switch (stage) {
      case 'First Outreach': return 0;
      case 'Second Outreach': return 1;
      case 'Third Outreach': return 2;
      default: return 0;
    }
  }
  return 0;
}

async function backfillConnections() {
  try {
    // Get total count
    const totalCount = await prisma.connection.count({
      where: {
        OR: [
          { state: null },
          { cycle: null },
          { nextAction: null }
        ]
      }
    });

    console.log(`📊 Found ${totalCount} connections needing migration\n`);

    if (totalCount === 0) {
      console.log('✅ No connections need migration. All done!');
      return;
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches
    for (let offset = 0; offset < totalCount; offset += batchSize) {
      console.log(`📦 Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalCount / batchSize)} (${offset + 1}-${Math.min(offset + batchSize, totalCount)})`);

      const connections = await prisma.connection.findMany({
        where: {
          OR: [
            { state: null },
            { cycle: null },
            { nextAction: null }
          ]
        },
        take: batchSize,
        skip: offset,
        select: {
          id: true,
          userId: true,
          stage: true,
          stageStatus: true,
          state: true,
          cycle: true,
          nextAction: true,
          lastReplyAt: true,
          lastContactedAt: true,
          fullName: true
        }
      });

      for (const connection of connections) {
        try {
          processedCount++;
          
          // Determine new state machine values
          const { state, cycle } = mapLegacyToState(
            connection.stage, 
            connection.stageStatus, 
            connection.lastReplyAt
          );
          
          const followupCount = computeFollowupCount(connection.stage, connection.stageStatus);
          
          const nextAction = computeNextAction({ state, cycle, followupCount });

          const updateData = {
            state: state,
            cycle: cycle,
            followupCount: followupCount,
            nextAction: nextAction,
            updatedAt: new Date()
          };

          console.log(`  ${connection.fullName || connection.id}: ${connection.stage}/${connection.stageStatus} → ${state}/C${cycle} (${nextAction})`);

          if (!isDryRun) {
            await prisma.connection.update({
              where: { id: connection.id },
              data: updateData
            });

            // Create timeline event for the migration
            await prisma.timelineEvent.create({
              data: {
                userId: connection.userId,
                connectionId: connection.id,
                kind: 'state_migration',
                title: 'Migrated to state machine',
                details: {
                  legacyStage: connection.stage,
                  legacyStageStatus: connection.stageStatus,
                  newState: state,
                  newCycle: cycle,
                  newNextAction: nextAction,
                  migrationScript: true,
                  timestamp: new Date().toISOString()
                }
              }
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to migrate connection ${connection.id}: ${error.message}`;
          console.error(`  ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`  ✅ Batch completed: ${successCount}/${processedCount} successful\n`);
    }

    // Summary
    console.log(`\n📋 Migration Summary:`);
    console.log(`Total processed: ${processedCount}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (isDryRun) {
      console.log(`\n🔍 DRY RUN - No changes were made`);
      console.log(`Run without --dry-run to apply changes`);
    } else {
      console.log(`\n✅ Migration completed successfully!`);
    }

    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error(`💥 Migration failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

async function validateMigration() {
  console.log(`\n🔍 Post-migration validation:`);
  
  try {
    // Check for any connections still missing state machine fields
    const missingState = await prisma.connection.count({
      where: { state: null }
    });
    
    const missingCycle = await prisma.connection.count({
      where: { cycle: null }
    });
    
    const missingNextAction = await prisma.connection.count({
      where: { nextAction: null }
    });

    console.log(`Connections missing state: ${missingState}`);
    console.log(`Connections missing cycle: ${missingCycle}`);
    console.log(`Connections missing nextAction: ${missingNextAction}`);

    if (missingState === 0 && missingCycle === 0 && missingNextAction === 0) {
      console.log(`✅ All connections have complete state machine data`);
    } else {
      console.log(`⚠️  Some connections still missing state machine data`);
    }

    // State distribution
    const stateDistribution = await prisma.connection.groupBy({
      by: ['state'],
      _count: { state: true }
    });

    console.log(`\nState distribution:`);
    stateDistribution.forEach(({ state, _count }) => {
      console.log(`  ${state}: ${_count.state}`);
    });

  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
  }
}

async function main() {
  try {
    await backfillConnections();
    
    if (!isDryRun) {
      await validateMigration();
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n👋 Migration interrupted by user');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Migration terminated');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the migration
main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});