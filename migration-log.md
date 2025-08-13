# State Machine Migration Log

## Overview
This document tracks all changes made during the migration from the legacy stage/stageStatus system to the authoritative state machine system.

## Migration Goals
1. Single source of truth for connection state
2. Server-enforced state transitions
3. Simplified frontend driven by nextAction
4. Complete audit trail of all state changes
5. Backward compatibility during migration

---

## Phase 0: Data Backfill (PRE-DEPLOYMENT)

### Backfill Script Execution
**Date**: 2025-08-12 (PRE-DEPLOYMENT)
**Status**: REQUIRED BEFORE GO-LIVE

#### Purpose
Migrate existing connections from legacy stage/stageStatus system to new state machine fields (state, cycle, nextAction) so all data renders correctly on day one.

#### Script Location
- `server/scripts/backfill-state-machine.js`

#### Execution Steps
```bash
# 1. Dry run to preview changes
node scripts/backfill-state-machine.js --dry-run

# 2. Execute with smaller batch size
node scripts/backfill-state-machine.js --batch-size=50

# 3. Validate results
node scripts/backfill-state-machine.js --dry-run  # Should show 0 connections
```

#### Legacy → State Mapping
- `Not Contacted` → `NOT_CONTACTED` (Cycle 1)
- `First Outreach` → `AWAITING_REPLY` (Cycle 1) 
- `Second Outreach` → `AWAITING_REPLY` (Cycle 2)
- `Third Outreach` → `AWAITING_REPLY` (Cycle 3)
- `Responded` → `REPLIED` (Cycle 1)

#### Status Refinements
- `draft_saved` → `DRAFTING`
- `waiting/awaiting_reply` → `AWAITING_REPLY`
- `positive_reply/negative_reply` → `REPLIED`

#### Validation Checklist
- [ ] All connections have `state` field populated
- [ ] All connections have `cycle` field (1-3)
- [ ] All connections have `nextAction` computed
- [ ] Timeline events created for each migration
- [ ] No data loss occurred
- [ ] Performance impact acceptable (<5 min execution)

## Current System Analysis (Before Migration)

### Legacy Systems Found
1. **Stage System**: "Not Contacted" | "First Outreach" | "Second Outreach" | "Third Outreach"
2. **StageStatus System**: "ready" | "draft_saved" | "waiting" | "awaiting_reply" | etc.
3. **Partial State Machine**: Basic OutreachState enum exists but not fully utilized

### Problems Identified
- Manual stage progression in multiple places
- Conflicting state representations
- Frontend deriving status from multiple fields
- No single source of truth
- Race conditions possible

---

## Phase 1: Backend State Machine Implementation

### Step 1.1: Enhance State Machine Schema
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Added missing states to OutreachState enum (BOUNCED, DO_NOT_CONTACT)
2. ✅ Added missing fields (followupCount, closedReason)
3. ✅ Added proper indexes for performance
4. ✅ Documented all fields with inline comments
5. ✅ Switched from SQLite to PostgreSQL
6. ✅ Created database and ran migration successfully

#### Files Modified:
- `server/prisma/schema.prisma`
- `server/.env`

#### Specific Changes:
- Added BOUNCED and DO_NOT_CONTACT states to OutreachState enum
- Added followupCount field (Int, default 0) to track follow-up count
- Added closedReason field (String?) for tracking why connection was closed
- Added documentation comments for all state machine fields
- Marked legacy fields (stage, stageStatus) as deprecated
- Added performance indexes for state filtering and follow-up queries
- Changed database provider from "sqlite" to "postgresql"
- Updated DATABASE_URL to use PostgreSQL connection string
- Created turnship_dev database
- Successfully applied migration: `20250812204004_add_complete_state_machine`

#### Migration Applied:
✅ `20250812204004_add_complete_state_machine` - Applied successfully

#### Backup Created:
- `server/prisma/schema.prisma.backup`

---

### Step 1.2: Complete flow.js Service
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Enhanced ALLOWED_TRANSITIONS with all 8 states
2. ✅ Added support for BOUNCED and DO_NOT_CONTACT states
3. ✅ Implemented complete transition validation logic
4. ✅ Added nextActionAt timing calculations
5. ✅ Created applyTransition function for server-enforced state changes
6. ✅ Added comprehensive documentation and comments

#### Files Modified:
- `server/src/services/flow.js`

#### Specific Changes:
- Expanded ALLOWED_TRANSITIONS to include all valid state transitions
- Added computeNextActionAt function for automatic follow-up scheduling
- Created isValidTransition function for server-side validation
- Implemented applyTransition function that handles all state changes atomically
- Added support for follow-up counting and cycle management
- Added metadata support for closure reasons
- Enhanced nextAction computation with cycle and follow-up awareness
- Added proper documentation for all functions and states

#### New Functions Added:
- `computeNextActionAt()` - Calculates when next action is due
- `isValidTransition()` - Validates state transitions
- `applyTransition()` - Applies transitions and returns new state data

---

### Step 1.3: Fix transition endpoint
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Updated imports to use new state machine functions
2. ✅ Replaced manual transition logic with applyTransition()
3. ✅ Added comprehensive error handling and validation
4. ✅ Added automatic timeline event creation
5. ✅ Added support for immediate transitions (SENT -> AWAITING_REPLY)
6. ✅ Added metadata support for transition context

#### Files Modified:
- `server/src/routes/connections.js`

#### Specific Changes:
- Updated imports to use ALLOWED_TRANSITIONS, isValidTransition, applyTransition
- Replaced manual state transition switch statement with applyTransition() function
- Added proper validation using isValidTransition()
- Enhanced error responses to include allowed actions
- Added automatic timeline event creation for all transitions
- Added support for metadata (reasons, gmailThreadId, etc.)
- Added handling for immediate transitions
- Improved error handling with detailed response messages
- Changed request body from { action, payload } to { action, metadata }

#### Backward Compatibility:
- Endpoint URL remains the same: POST /:id/transition
- Response format unchanged (returns updated connection)
- Error status codes remain consistent

---

### Step 1.4: Migrate existing routes to use transitions
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Added transition helper function to email routes
2. ✅ Migrated /generate endpoint to use START_DRAFTING transition
3. ✅ Migrated /send endpoint to use SEND_EMAIL transition
4. ✅ Migrated /batch-generate endpoint to use START_DRAFTING transition
5. ✅ Migrated draft update endpoint to ensure DRAFTING state
6. ✅ Migrated /check-replies endpoint to use REPLY_RECEIVED transition
7. ✅ Migrated /simulate-replies endpoint to use REPLY_RECEIVED transition
8. ✅ Added error handling with fallback to manual state updates

#### Files Modified:
- `server/src/routes/emails.js`

#### Specific Changes:
- Added transitionConnection() helper function for email route transitions
- Replaced manual state updates in email generation with START_DRAFTING transition
- Replaced manual state updates in email sending with SEND_EMAIL + immediate MARK_AWAITING
- Added comprehensive error handling with fallback to manual updates
- Maintained backward compatibility with legacy stage/stageStatus fields
- Added metadata support for gmail message IDs and sentiment tracking
- Enhanced reply processing with state machine transitions

#### Migration Strategy:
- **Graceful fallback**: All transitions include try/catch with manual fallback
- **Backward compatibility**: Legacy fields (stage, stageStatus) still updated
- **Error handling**: Failed transitions log errors but don't break functionality
- **Timeline events**: Existing timeline event creation preserved

#### Routes Migrated:
- `POST /api/emails/generate` - Uses START_DRAFTING transition
- `POST /api/emails/send` - Uses SEND_EMAIL + MARK_AWAITING transitions  
- `POST /api/emails/batch-generate` - Uses START_DRAFTING for each connection
- `PUT /api/emails/drafts/:id` - Ensures DRAFTING state when saving drafts
- `POST /api/emails/check-replies` - Uses REPLY_RECEIVED transition
- `POST /api/emails/simulate-replies` - Uses REPLY_RECEIVED transition

---

## Phase 2: Frontend Integration

### Step 2.1: Update frontend API calls to use transitions
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Updated Connection interface with new state machine fields
2. ✅ Fixed transitionConnection API call to use metadata instead of payload
3. ✅ Updated connection reset to use REOPEN_CONNECTION transition
4. ✅ Added handleTransition helper function for error handling

#### Files Modified:
- `client/src/lib/api.ts`
- `client/src/pages/connections.tsx`

#### Specific Changes:
- Added BOUNCED and DO_NOT_CONTACT to state type union
- Added followupCount and closedReason fields to Connection interface
- Updated transitionConnection to use metadata parameter (matches backend)
- Replaced manual connection reset with REOPEN_CONNECTION transition
- Added centralized error handling for all transitions

---

### Step 2.2: Create state machine UI helpers
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Created comprehensive state machine utilities
2. ✅ Added state display information with colors and descriptions
3. ✅ Added action information with button labels and variants
4. ✅ Added helper functions for status computation
5. ✅ Added time formatting utilities

#### Files Created:
- `client/src/lib/stateMachine.ts`

#### Specific Changes:
- Defined complete OutreachState and StateTransition types
- Created ALLOWED_TRANSITIONS mapping for validation
- Added STATE_INFO with display colors and descriptions
- Added ACTION_INFO with UI button information
- Created helper functions: getConnectionStatus, formatTimeSince, isActionDue, getTimeUntilDue
- Added transition validation functions

---

### Step 2.3: Update connection components to show state-based UI
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Updated connections table to use state machine UI
2. ✅ Enhanced connection status display with tooltips
3. ✅ Added cycle and follow-up count indicators
4. ✅ Updated alumni view with state machine information
5. ✅ Enhanced email composer with state machine details

#### Files Modified:
- `client/src/pages/connections.tsx`
- `client/src/components/email-composer.tsx`

#### Specific Changes:
- Replaced getStageBadge with getStateBadge using state machine
- Enhanced status display with next action information and tooltips
- Added cycle and follow-up count indicators in table
- Added time until due information for overdue actions
- Updated email composer to show state, cycle, and action information
- Improved connection info display with enhanced state details

#### UI Improvements:
- **Table View**: Shows state badge, cycle info, follow-up count, and enhanced status
- **Alumni View**: Includes cycle information and enhanced tooltips
- **Email Composer**: Rich connection status with state, description, and timing info
- **Status Indicators**: Color-coded badges with descriptive tooltips
- **Action Feedback**: Clear next action guidance with due dates

---

## Phase 3: Legacy Cleanup and Validation

### Step 3.1: Add backward compatibility warnings for legacy fields
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Created state machine validation middleware
2. ✅ Added deprecation warnings for legacy endpoints
3. ✅ Added validation for state machine fields
4. ✅ Added consistency checks for nextAction computation
5. ✅ Added logging for state transitions

#### Files Created:
- `server/src/middleware/stateMachineValidation.js`

#### Files Modified:
- `server/src/routes/connections.js`

#### Specific Changes:
- Added validateStateMachine middleware to warn about legacy field usage
- Added ensureNextActionConsistency middleware to maintain data integrity
- Added logStateTransitions middleware for debugging and monitoring
- Marked /advance-stage endpoint as deprecated with proper headers
- Added state validation for API requests
- Added cycle and followupCount bounds checking

#### Validation Features:
- **Legacy Field Detection**: Warns when stage, stageStatus, currentDraftId are used
- **State Validation**: Ensures only valid state values are accepted
- **Cycle Bounds**: Validates cycle is between 1-3
- **NextAction Consistency**: Auto-corrects nextAction when state/cycle provided
- **Deprecation Headers**: Adds HTTP headers for deprecated endpoints
- **Transition Logging**: Logs all state transitions for monitoring

---

### Step 3.2: Update any remaining legacy references
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Updated analytics to include both legacy and new state data
2. ✅ Added state machine breakdown alongside legacy stage breakdown
3. ✅ Marked legacy data structures with deprecation comments
4. ✅ Ensured backward compatibility for analytics consumers

#### Files Modified:
- `server/src/routes/analytics.js`

#### Specific Changes:
- Added stateFunnel and stateBreakdown for new state machine analytics
- Maintained stageFunnel and stageBreakdown for backward compatibility
- Added deprecation comments to clearly mark legacy structures
- Enhanced analytics response with both old and new data structures

#### Analytics Enhancement:
- **Dual Data Structures**: Provides both legacy stage and new state breakdowns
- **Backward Compatibility**: Existing analytics consumers continue to work
- **Clear Migration Path**: New consumers can use state-based analytics
- **Deprecation Marking**: Legacy fields clearly marked for future removal

---

## Phase 4: Production Readiness

### Production Hardening Enhancements
**Date**: 2025-08-12
**Status**: COMPLETED ✅

#### Changes Made:
1. ✅ Created comprehensive data backfill script with dry-run mode
2. ✅ Added deprecation cutoff timeline with enforcement phases
3. ✅ Implemented optimistic concurrency control with version checking
4. ✅ Added idempotency protection for critical operations
5. ✅ Documented follow-up SLA configuration and monitoring
6. ✅ Created production-required test suite with 7 critical gates

#### Files Created:
- `server/scripts/backfill-state-machine.js` - Data migration script
- `server/src/middleware/concurrency.js` - Concurrency and idempotency middleware
- `server/docs/follow-up-sla.md` - SLA configuration documentation
- `server/tests/state-machine.test.js` - Required production test gates

#### Files Enhanced:
- `server/prisma/schema.prisma` - Added version field and IdempotencyKey model
- `server/src/middleware/stateMachineValidation.js` - Added deprecation timeline enforcement
- `server/src/routes/connections.js` - Added concurrency protection to transitions

#### Production Features Added:

##### 1. Data Backfill Script
- **Legacy → State Mapping**: Comprehensive migration logic
- **Batch Processing**: Configurable batch sizes for large datasets
- **Dry Run Mode**: Preview changes before execution
- **Validation**: Post-migration integrity checks
- **Timeline Events**: Audit trail for all migrations

##### 2. Deprecation Timeline (T+30 enforcement)
- **Phase 1 (T+0→T+14)**: Soft warnings for legacy field usage
- **Phase 2 (T+14→T+30)**: Strict warnings with countdown
- **Phase 3 (T+30+)**: Hard rejection of legacy fields
- **Cutoff Dates**: 2025-08-26 (warnings), 2025-09-11 (removal)

##### 3. Optimistic Concurrency Control
- **Version Field**: Added to Connection model for conflict detection
- **Version Checking**: Validate expected version in transition metadata
- **409 Conflicts**: Proper HTTP status codes for version mismatches
- **Atomic Updates**: Version increment with each transition

##### 4. Idempotency Protection
- **Required Endpoints**: SEND_EMAIL and other critical transitions
- **Key Validation**: Client-provided idempotency keys
- **Response Caching**: 24-hour TTL for duplicate request detection
- **Conflict Detection**: Hash-based request fingerprinting

##### 5. Follow-up SLA Documentation
- **Default Windows**: 3 days initial, 7 days follow-ups
- **Business Rules**: Configurable via environment variables
- **Monitoring Queries**: Pre-built SQL for SLA tracking
- **Escalation Rules**: 3-tier alert system for overdue actions

##### 6. Production Test Gates (REQUIRED)
- **Gate 1**: E2E positive reply flow validation
- **Gate 2**: Complete 3-cycle no-reply exhaustion
- **Gate 3**: Invalid transition rejection (422 errors)
- **Gate 4**: Duplicate send protection via idempotency
- **Gate 5**: Optimistic concurrency conflict handling
- **Gate 6**: Data integrity and timeline event creation
- **Gate 7**: Performance requirements (<500ms response)

#### Deployment Prerequisites:
- [ ] Run backfill script: `node scripts/backfill-state-machine.js`
- [ ] Execute database migration: `npx prisma migrate deploy`
- [ ] Validate all 7 production test gates pass
- [ ] Configure monitoring alerts for SLA breaches
- [ ] Set up idempotency key cleanup job (24h TTL)
- [ ] Document rollback procedure for emergency revert

#### Monitoring & Operations:
- **SLA Tracking**: Automated overdue action detection
- **Version Conflicts**: Monitor 409 response rates
- **Idempotency Usage**: Track duplicate request patterns
- **Performance**: Response time monitoring (<500ms target)
- **Error Rates**: Track state transition failures

---

## Change History

### Change #001 - Create Migration Log
**Date**: 2025-08-12
**File**: migration-log.md (this file)
**Purpose**: Track all changes during state machine migration
**Impact**: None - documentation only

---

## Rollback Instructions

If any issues arise during migration:

1. **Database Rollback**: 
   ```bash
   npx prisma migrate rollback
   ```

2. **Code Rollback**:
   ```bash
   git checkout <last-stable-commit>
   ```

3. **Legacy Field Restoration**:
   Keep using stage/stageStatus fields which remain in database

---

## Testing Checklist

- [ ] All existing connections still load
- [ ] Can create new connections
- [ ] Can generate drafts
- [ ] Can send emails
- [ ] State transitions work correctly
- [ ] Frontend displays correct status
- [ ] No data loss occurred

---

## Notes

- Always test changes locally first
- Keep legacy fields populated during migration
- Monitor logs for any transition errors
- Document any unexpected behaviors