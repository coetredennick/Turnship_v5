# Follow-up SLA Configuration

## Overview

The state machine automatically computes `nextActionAt` timestamps to schedule follow-up actions. This document defines the default SLA windows and override mechanisms.

## Default SLA Windows

### Initial Response Window
- **AWAITING_REPLY → First Follow-up**: 3 days
- **Purpose**: Allow prospects time to respond to initial outreach
- **Rationale**: Industry standard for professional networking

### Subsequent Follow-ups  
- **Follow-up 1 → Follow-up 2**: 7 days
- **Follow-up 2 → Follow-up 3**: 7 days
- **Purpose**: Persistent but respectful follow-up cadence
- **Rationale**: Weekly cadence maintains top-of-mind without being pushy

### Cycle Planning
- **REPLIED → Next Cycle Planning**: 1 day
- **Purpose**: Give user time to plan next outreach cycle
- **Rationale**: Immediate action required when prospect responds

## Configuration

### Code Location
- **Primary Logic**: `server/src/services/flow.js` → `computeNextActionAt()`
- **Override Mechanism**: User profile settings (future enhancement)
- **Business Rules**: Configurable via environment variables

### Environment Variables
```bash
# Default follow-up timing (in days)
FOLLOW_UP_INITIAL_DAYS=3
FOLLOW_UP_SUBSEQUENT_DAYS=7
CYCLE_PLANNING_DAYS=1

# Business hours consideration
BUSINESS_HOURS_ONLY=false
TIMEZONE_DEFAULT=UTC

# Weekend/holiday handling
SKIP_WEEKENDS=true
SKIP_HOLIDAYS=false
```

### Per-User Overrides (Future)
```javascript
// Profile-based overrides
{
  userId: "user123",
  followUpSettings: {
    initialResponseDays: 5,     // Custom initial window
    subsequentDays: 10,         // Custom follow-up cadence
    maxFollowUps: 2,           // Limit follow-up count
    businessHoursOnly: true,    // Only schedule during business hours
    timezone: "America/New_York"
  }
}
```

## SLA Monitoring

### Overdue Detection
```javascript
// Check if action is overdue
function isActionOverdue(connection) {
  if (!connection.nextActionAt) return false;
  return new Date(connection.nextActionAt) < new Date();
}
```

### Analytics Tracking
- **On-time Rate**: % of actions taken within SLA window
- **Average Response Time**: Mean time from nextActionAt to action taken
- **SLA Violations**: Count of overdue actions by user/timeframe

### Alerts & Escalation
- **Daily Digest**: Overdue actions for each user
- **Weekly Report**: SLA performance metrics
- **Escalation**: Actions overdue by >2x SLA window

## Business Logic

### State-Specific Timing

#### AWAITING_REPLY
```javascript
if (followupCount === 0) {
  // First follow-up: 3 days after initial send
  return addDays(lastContactedAt, 3);
} else {
  // Subsequent follow-ups: 7 days after previous
  return addDays(lastContactedAt, 7);
}
```

#### REPLIED
```javascript
// Give user 1 day to plan next cycle
return addDays(now, 1);
```

#### BOUNCED
```javascript
// Immediate action required
return now;
```

### Business Hours Calculation
```javascript
function adjustForBusinessHours(date, timezone = 'UTC') {
  const adjusted = new Date(date);
  
  // If weekend, move to next Monday
  if (SKIP_WEEKENDS && isWeekend(adjusted)) {
    adjusted.setDate(adjusted.getDate() + (8 - adjusted.getDay()));
  }
  
  // Set to 9 AM business hours
  if (BUSINESS_HOURS_ONLY) {
    adjusted.setHours(9, 0, 0, 0);
  }
  
  return adjusted;
}
```

## Monitoring Queries

### Overdue Actions
```sql
SELECT 
  u.email,
  c.fullName,
  c.nextAction,
  c.nextActionAt,
  NOW() - c.nextActionAt as overdue_duration
FROM connections c
JOIN users u ON c.userId = u.id
WHERE c.nextActionAt < NOW()
  AND c.state NOT IN ('CLOSED', 'DO_NOT_CONTACT')
ORDER BY overdue_duration DESC;
```

### SLA Performance
```sql
SELECT 
  DATE_TRUNC('week', te.at) as week,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN te.at <= c.nextActionAt THEN 1 END) as on_time_actions,
  ROUND(
    COUNT(CASE WHEN te.at <= c.nextActionAt THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as on_time_percentage
FROM timeline_events te
JOIN connections c ON te.connectionId = c.id
WHERE te.kind = 'state_transition'
  AND c.nextActionAt IS NOT NULL
GROUP BY week
ORDER BY week DESC;
```

## Escalation Rules

### Level 1: Daily Digest
- **Trigger**: Actions overdue by 1+ days
- **Action**: Email summary to user
- **Template**: List of overdue connections with suggested actions

### Level 2: Weekly Report  
- **Trigger**: Weekly scheduled report
- **Action**: Performance metrics and trends
- **Recipients**: User + manager (if configured)

### Level 3: Critical Overdue
- **Trigger**: Actions overdue by 2x SLA window (6+ days for initial, 14+ days for follow-ups)
- **Action**: Slack notification + email escalation
- **Recipients**: User + account manager

## Configuration Updates

To modify SLA windows:

1. **Temporary Override**: Update environment variables
2. **Code Change**: Modify `computeNextActionAt()` in `flow.js`
3. **Database Migration**: Add per-user settings table
4. **UI Enhancement**: Add SLA preferences to user profile

## Testing SLA Changes

```javascript
// Test SLA computation
const testCases = [
  {
    state: 'AWAITING_REPLY',
    lastContactedAt: '2025-08-12T10:00:00Z',
    followupCount: 0,
    expected: '2025-08-15T10:00:00Z' // +3 days
  },
  {
    state: 'AWAITING_REPLY', 
    lastContactedAt: '2025-08-12T10:00:00Z',
    followupCount: 1,
    expected: '2025-08-19T10:00:00Z' // +7 days
  }
];
```

This SLA framework ensures consistent follow-up timing while providing flexibility for future customization and monitoring.