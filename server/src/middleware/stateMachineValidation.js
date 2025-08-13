/**
 * State Machine Validation Middleware
 * 
 * Ensures state machine consistency and warns about legacy field usage.
 * 
 * DEPRECATION SCHEDULE:
 * - Phase 1 (T+0 to T+14): Legacy fields supported with warnings
 * - Phase 2 (T+14 to T+30): Legacy fields supported with strict warnings  
 * - Phase 3 (T+30+): Legacy fields rejected with 400 errors
 * 
 * Current deployment date: 2025-08-12
 * Legacy field warning cutoff: 2025-08-26 (T+14)
 * Legacy field removal date: 2025-09-11 (T+30)
 */

const { isValidTransition, computeNextAction } = require('../services/flow');

// Deprecation enforcement dates
const DEPLOYMENT_DATE = new Date('2025-08-12');
const WARNING_CUTOFF = new Date('2025-08-26'); // T+14 days
const REMOVAL_DATE = new Date('2025-09-11');   // T+30 days

// Middleware to validate state machine consistency
function validateStateMachine(req, res, next) {
  // Only validate on updates that include state machine fields
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
    return next();
  }

  const data = req.body || {};
  const now = new Date();
  
  // Check for legacy field usage and warn
  const legacyFields = ['stage', 'stageStatus', 'currentDraftId'];
  const usedLegacyFields = legacyFields.filter(field => data.hasOwnProperty(field));
  
  if (usedLegacyFields.length > 0) {
    const daysUntilWarningCutoff = Math.ceil((WARNING_CUTOFF - now) / (1000 * 60 * 60 * 24));
    const daysUntilRemoval = Math.ceil((REMOVAL_DATE - now) / (1000 * 60 * 60 * 24));
    
    // Phase 3: Reject legacy fields after removal date
    if (now >= REMOVAL_DATE) {
      return res.status(400).json({
        error: 'Legacy fields no longer supported',
        legacyFieldsUsed: usedLegacyFields,
        message: 'Legacy stage/stageStatus fields were removed. Use state machine transitions.',
        migrationGuide: 'https://docs.yourapp.com/migration/state-machine',
        removedDate: REMOVAL_DATE.toISOString()
      });
    }
    
    // Phase 2: Strict warnings
    if (now >= WARNING_CUTOFF) {
      console.error(`STRICT WARNING: Legacy fields will be removed in ${daysUntilRemoval} days: ${usedLegacyFields.join(', ')}`);
      res.set('X-Legacy-Fields-Removal-Warning', `${daysUntilRemoval} days until removal`);
      res.set('X-Legacy-Fields-Removal-Date', REMOVAL_DATE.toISOString());
    } else {
      // Phase 1: Soft warnings
      console.warn(`DEPRECATED: Legacy fields used in request: ${usedLegacyFields.join(', ')}`);
      console.warn(`Consider migrating to the new state machine fields: state, cycle, nextAction`);
      console.warn(`Legacy support ends in ${daysUntilRemoval} days (${REMOVAL_DATE.toISOString()})`);
    }
    
    // Add deprecation headers
    res.set('X-Legacy-Fields-Used', usedLegacyFields.join(', '));
    res.set('X-Deprecated-Message', 'Legacy stage fields are deprecated. Use state machine transitions.');
    res.set('X-Legacy-Removal-Date', REMOVAL_DATE.toISOString());
    res.set('X-Days-Until-Removal', daysUntilRemoval.toString());
  }

  // Validate state machine fields if present
  if (data.state) {
    const validStates = [
      'NOT_CONTACTED', 'DRAFTING', 'SENT', 'AWAITING_REPLY', 
      'REPLIED', 'BOUNCED', 'DO_NOT_CONTACT', 'CLOSED'
    ];
    
    if (!validStates.includes(data.state)) {
      return res.status(400).json({
        error: 'Invalid state',
        validStates,
        provided: data.state
      });
    }
  }

  // Validate cycle bounds
  if (data.cycle !== undefined) {
    if (typeof data.cycle !== 'number' || data.cycle < 1 || data.cycle > 3) {
      return res.status(400).json({
        error: 'Invalid cycle. Must be a number between 1 and 3',
        provided: data.cycle
      });
    }
  }

  // Validate followupCount
  if (data.followupCount !== undefined) {
    if (typeof data.followupCount !== 'number' || data.followupCount < 0) {
      return res.status(400).json({
        error: 'Invalid followupCount. Must be a non-negative number',
        provided: data.followupCount
      });
    }
  }

  next();
}

// Middleware to ensure nextAction consistency
function ensureNextActionConsistency(req, res, next) {
  const data = req.body || {};
  
  // If state and cycle are provided, ensure nextAction is computed correctly
  if (data.state && data.cycle) {
    const computedNextAction = computeNextAction({
      state: data.state,
      cycle: data.cycle,
      followupCount: data.followupCount || 0
    });
    
    // If nextAction is provided but doesn't match computed value, warn
    if (data.nextAction && data.nextAction !== computedNextAction) {
      console.warn(`WARNING: Provided nextAction "${data.nextAction}" doesn't match computed value "${computedNextAction}"`);
      console.warn('The computed value will be used to maintain consistency.');
      
      // Override with computed value
      data.nextAction = computedNextAction;
      
      res.set('X-NextAction-Overridden', 'true');
      res.set('X-Computed-NextAction', computedNextAction);
    }
  }

  next();
}

// Middleware to log state transitions for debugging
function logStateTransitions(req, res, next) {
  if (req.path.includes('/transition')) {
    const { action, metadata } = req.body || {};
    const connectionId = req.params.id;
    
    console.log(`State Transition: Connection ${connectionId} -> Action: ${action}`, {
      metadata,
      userId: req.session?.user?.id,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

module.exports = {
  validateStateMachine,
  ensureNextActionConsistency,
  logStateTransitions
};