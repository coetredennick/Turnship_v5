// Minimal runtime test for transition endpoint using fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const base = process.env.API_BASE || 'http://localhost:3001';
  const cookie = process.env.TEST_COOKIE || '';
  const headers = { 'Content-Type': 'application/json', 'Cookie': cookie };

  // Create a connection
  let res = await fetch(`${base}/api/connections`, { method: 'POST', headers, body: JSON.stringify({ fullName: 'Test User', email: `test_${Date.now()}@example.com` }) });
  const conn = await res.json();

  // 1) NOT_CONTACTED -> START_DRAFTING -> SEND_EMAIL -> AWAITING_REPLY
  await fetch(`${base}/api/connections/${conn.id}/transition`, { method: 'POST', headers, body: JSON.stringify({ action: 'START_DRAFTING' }) });
  res = await fetch(`${base}/api/connections/${conn.id}/transition`, { method: 'POST', headers, body: JSON.stringify({ action: 'SEND_EMAIL' }) });
  let updated = await res.json();
  console.log('After send:', updated.state, updated.nextAction);

  // 2) AWAITING_REPLY -> REPLY_RECEIVED -> REPLIED
  res = await fetch(`${base}/api/connections/${conn.id}/transition`, { method: 'POST', headers, body: JSON.stringify({ action: 'REPLY_RECEIVED' }) });
  updated = await res.json();
  console.log('After reply:', updated.state, updated.nextAction);

  // 3) REPLIED (cycle 1) -> ADVANCE_CYCLE -> DRAFTING (cycle 2)
  res = await fetch(`${base}/api/connections/${conn.id}/transition`, { method: 'POST', headers, body: JSON.stringify({ action: 'ADVANCE_CYCLE' }) });
  updated = await res.json();
  console.log('After advance:', updated.state, updated.cycle, updated.nextAction);

  // 4) Invalid jump should fail
  res = await fetch(`${base}/api/connections/${conn.id}/transition`, { method: 'POST', headers, body: JSON.stringify({ action: 'MARK_CLOSED' }) });
  if (res.ok) throw new Error('Invalid transition should not be ok');
  console.log('Invalid transition blocked as expected');
}

run().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node

/**
 * Comprehensive Test Script for Connection Flow
 * Tests the complete lifecycle of a connection through all stages
 */

const axios = require('axios').default;
const colors = require('colors');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test.connection@example.com';

// Test configuration
const config = {
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
  withCredentials: true, // Include cookies for session management
};

let testConnectionId = null;
let testDraftId = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors_map = {
    info: 'cyan',
    success: 'green', 
    error: 'red',
    warning: 'yellow',
    step: 'blue'
  };
  console.log(`[${timestamp}] ${message}`[colors_map[type]] || message);
}

function logResponse(response, context) {
  log(`${context} - Status: ${response.status}`, response.status < 300 ? 'success' : 'error');
  if (response.data) {
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  }
  console.log('---');
}

async function makeRequest(method, url, data = null, expectedStatus = 200) {
  try {
    const response = await axios({
      method,
      url,
      data,
      ...config
    });
    
    if (response.status !== expectedStatus) {
      log(`Expected status ${expectedStatus}, got ${response.status}`, 'warning');
    }
    
    return response;
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    if (error.response) {
      logResponse(error.response, `Error Response for ${method} ${url}`);
    }
    throw error;
  }
}

// Test steps
async function step1_CreateConnection() {
  log('Step 1: Creating a new connection', 'step');
  
  const connectionData = {
    fullName: 'John Test User',
    email: TEST_EMAIL,
    company: 'Test Corp',
    role: 'Senior Engineer',
    location: 'San Francisco, CA',
    notes: 'Test connection for flow validation',
    alumni: false,
    tags: ['test', 'automation']
  };
  
  const response = await makeRequest('POST', '/api/connections', connectionData, 200);
  logResponse(response, 'Create Connection');
  
  if (response.data && response.data.id) {
    testConnectionId = response.data.id;
    log(`Created connection with ID: ${testConnectionId}`, 'success');
    
    // Verify initial stage
    if (response.data.stage === 'Not Contacted') {
      log('✓ Connection created with correct initial stage: Not Contacted', 'success');
    } else {
      log(`✗ Expected stage 'Not Contacted', got '${response.data.stage}'`, 'error');
    }
    
    if (response.data.stageStatus === 'ready') {
      log('✓ Connection created with correct initial status: ready', 'success');
    } else {
      log(`✗ Expected status 'ready', got '${response.data.stageStatus}'`, 'error');
    }
  } else {
    throw new Error('Failed to create connection - no ID returned');
  }
}

async function step2_GenerateDraft() {
  log('Step 2: Generating email draft', 'step');
  log(`Using connection ID: ${testConnectionId}`, 'info');
  
  // First verify the connection exists and is accessible
  log('Verifying connection accessibility...', 'info');
  const allConnections = await makeRequest('GET', '/api/connections', null, 200);
  log(`Total connections found: ${allConnections.data ? allConnections.data.length : 0}`, 'info');
  
  const matchingConnection = allConnections.data.find(c => c.id === testConnectionId);
  if (matchingConnection) {
    log('✓ Connection found by ID in all connections list', 'success');
    log(`Connection details: stage=${matchingConnection.stage}, status=${matchingConnection.stageStatus}`, 'info');
  } else {
    log('✗ Connection not found by ID in all connections', 'error');
  }
  
  const draftData = {
    connection_id: testConnectionId,
    purpose: 'informational-interview',
    tone: 'Warm',
    length: 'Short'
  };
  
  const response = await makeRequest('POST', '/api/emails/generate', draftData, 200);
  logResponse(response, 'Generate Draft');
  
  if (response.data && response.data.id) {
    testDraftId = response.data.id;
    log(`Generated draft with ID: ${testDraftId}`, 'success');
    
    // Verify draft content
    if (response.data.subject && response.data.body) {
      log('✓ Draft contains subject and body', 'success');
    } else {
      log('✗ Draft missing subject or body', 'error');
    }
  } else {
    throw new Error('Failed to generate draft - no ID returned');
  }
  
  // Check if connection was updated to First Outreach
  const connectionCheck = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
  if (connectionCheck.data && connectionCheck.data.length > 0) {
    const connection = connectionCheck.data[0];
    if (connection.stage === 'First Outreach') {
      log('✓ Connection advanced to First Outreach stage after draft generation', 'success');
    } else {
      log(`✗ Expected stage 'First Outreach', got '${connection.stage}'`, 'error');
    }
    
    if (connection.stageStatus === 'draft_saved') {
      log('✓ Connection status updated to draft_saved', 'success');
    } else {
      log(`✗ Expected status 'draft_saved', got '${connection.stageStatus}'`, 'error');
    }
  }
}

async function step3_SendEmail() {
  log('Step 3: Sending email', 'step');
  
  const sendData = {
    draft_id: testDraftId
  };
  
  const response = await makeRequest('POST', '/api/emails/send', sendData, 200);
  logResponse(response, 'Send Email');
  
  // Check connection status after sending
  const connectionCheck = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
  if (connectionCheck.data && connectionCheck.data.length > 0) {
    const connection = connectionCheck.data[0];
    
    if (connection.stageStatus === 'awaiting_reply') {
      log('✓ Connection status updated to awaiting_reply after sending', 'success');
    } else {
      log(`✗ Expected status 'awaiting_reply', got '${connection.stageStatus}'`, 'error');
    }
    
    if (connection.lastContactedAt) {
      log('✓ lastContactedAt timestamp updated', 'success');
    } else {
      log('✗ lastContactedAt not updated after sending', 'error');
    }
    
    if (connection.currentDraftId === null) {
      log('✓ currentDraftId cleared after sending', 'success');
    } else {
      log('✗ currentDraftId not cleared after sending', 'error');
    }
  }
}

async function step4_SimulateReply() {
  log('Step 4: Simulating email reply', 'step');
  
  // First, let's trigger the reply simulation endpoint
  const response = await makeRequest('POST', '/api/emails/simulate-replies', {}, 200);
  logResponse(response, 'Simulate Replies');
  
  // Check if our connection got a reply
  const connectionCheck = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
  if (connectionCheck.data && connectionCheck.data.length > 0) {
    const connection = connectionCheck.data[0];
    
    log(`Connection status after reply simulation: ${connection.stageStatus}`, 'info');
    
    if (['positive_reply', 'negative_reply'].includes(connection.stageStatus)) {
      log(`✓ Reply received with sentiment: ${connection.stageStatus}`, 'success');
      
      if (connection.lastReplyAt) {
        log('✓ lastReplyAt timestamp updated', 'success');
      } else {
        log('✗ lastReplyAt not updated', 'error');
      }
      
      if (connection.replySentiment) {
        log(`✓ Reply sentiment recorded: ${connection.replySentiment}`, 'success');
      } else {
        log('✗ Reply sentiment not recorded', 'error');
      }
    } else {
      log('ⓘ No reply generated in this simulation cycle', 'info');
    }
  }
}

async function step5_AdvanceToNextStage() {
  log('Step 5: Advancing to next stage', 'step');
  
  // Generate another draft (should move to Second Outreach)
  const draftData = {
    connection_id: testConnectionId,
    purpose: 'follow-up',
    tone: 'Professional',
    length: 'Medium'
  };
  
  const response = await makeRequest('POST', '/api/emails/generate', draftData, 200);
  logResponse(response, 'Generate Follow-up Draft');
  
  if (response.data && response.data.id) {
    const newDraftId = response.data.id;
    log(`Generated follow-up draft with ID: ${newDraftId}`, 'success');
    
    // Send the follow-up
    const sendResponse = await makeRequest('POST', '/api/emails/send', { draft_id: newDraftId }, 200);
    logResponse(sendResponse, 'Send Follow-up');
    
    // Check stage progression
    const connectionCheck = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
    if (connectionCheck.data && connectionCheck.data.length > 0) {
      const connection = connectionCheck.data[0];
      
      if (connection.stage === 'Second Outreach') {
        log('✓ Connection advanced to Second Outreach stage', 'success');
      } else {
        log(`✗ Expected stage 'Second Outreach', got '${connection.stage}'`, 'error');
      }
    }
  }
}

async function step6_TestManualStageAdvancement() {
  log('Step 6: Testing manual stage advancement', 'step');
  
  const response = await makeRequest('POST', `/api/connections/${testConnectionId}/advance-stage`, {}, 200);
  logResponse(response, 'Manual Stage Advancement');
  
  if (response.data) {
    if (response.data.stage === 'Third Outreach') {
      log('✓ Manual advancement to Third Outreach successful', 'success');
    } else {
      log(`✗ Expected stage 'Third Outreach', got '${response.data.stage}'`, 'error');
    }
  }
}

async function step7_TestConnectionReset() {
  log('Step 7: Testing connection reset', 'step');
  
  // First get all drafts for this connection
  const draftsResponse = await makeRequest('GET', `/api/drafts?connectionId=${testConnectionId}`, null, 200);
  const draftCount = draftsResponse.data ? draftsResponse.data.length : 0;
  log(`Connection has ${draftCount} drafts before reset`, 'info');
  
  // Reset the connection using PATCH (as the frontend does)
  const resetData = {
    stage: 'Not Contacted',
    stageStatus: 'ready',
    currentDraftId: null,
    lastContactedAt: null,
    lastReplyAt: null,
    replySentiment: null
  };
  
  const response = await makeRequest('PATCH', `/api/connections/${testConnectionId}`, resetData, 200);
  logResponse(response, 'Connection Reset');
  
  if (response.data) {
    const checks = [
      ['stage', 'Not Contacted'],
      ['stageStatus', 'ready'],
      ['currentDraftId', null],
      ['lastContactedAt', null],
      ['lastReplyAt', null],
      ['replySentiment', null]
    ];
    
    checks.forEach(([field, expected]) => {
      if (response.data[field] === expected) {
        log(`✓ ${field} reset correctly to ${expected}`, 'success');
      } else {
        log(`✗ ${field} not reset - expected ${expected}, got ${response.data[field]}`, 'error');
      }
    });
  }
}

async function step8_TestFollowUpLogic() {
  log('Step 8: Testing follow-up logic', 'step');
  
  // Create a connection that should show follow-up due
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 4); // 4 days ago
  
  const updateData = {
    stage: 'First Outreach',
    stageStatus: 'awaiting_reply',
    lastContactedAt: oldDate.toISOString()
  };
  
  const response = await makeRequest('PATCH', `/api/connections/${testConnectionId}`, updateData, 200);
  logResponse(response, 'Setup Follow-up Test');
  
  // Check if follow-up logic detects this
  const connectionCheck = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
  if (connectionCheck.data && connectionCheck.data.length > 0) {
    const connection = connectionCheck.data[0];
    
    // Test the follow-up due logic (3+ days since contact)
    const lastContacted = new Date(connection.lastContactedAt);
    const daysSince = Math.floor((new Date() - lastContacted) / (1000 * 60 * 60 * 24));
    
    if (daysSince >= 3) {
      log(`✓ Follow-up logic working - ${daysSince} days since last contact`, 'success');
    } else {
      log(`✗ Follow-up logic issue - only ${daysSince} days since last contact`, 'error');
    }
  }
}

async function step9_TestConnectionDeletion() {
  log('Step 9: Testing connection deletion', 'step');
  
  const response = await makeRequest('DELETE', `/api/connections/${testConnectionId}`, null, 200);
  logResponse(response, 'Delete Connection');
  
  // Verify deletion
  const checkResponse = await makeRequest('GET', `/api/connections?query=${TEST_EMAIL}`, null, 200);
  if (checkResponse.data && checkResponse.data.length === 0) {
    log('✓ Connection deleted successfully', 'success');
  } else {
    log('✗ Connection still exists after deletion', 'error');
  }
}

async function runHealthCheck() {
  log('Running health check and authentication...', 'step');
  
  try {
    // First authenticate with dev login
    const authResponse = await makeRequest('POST', '/auth/dev-login', {}, 200);
    log('✓ Dev authentication successful', 'success');
    
    // Then test API access
    const response = await makeRequest('GET', '/api/connections', null, 200);
    log('✓ API is accessible', 'success');
    return true;
  } catch (error) {
    log('✗ API health check failed', 'error');
    log('Make sure the server is running on http://localhost:3001', 'warning');
    if (error.response) {
      logResponse(error.response, 'Health Check Error');
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Connection Flow Test Suite'.bold.green);
  console.log('=====================================');
  
  const healthy = await runHealthCheck();
  if (!healthy) {
    process.exit(1);
  }
  
  try {
    await step1_CreateConnection();
    await step2_GenerateDraft();
    await step3_SendEmail();
    await step4_SimulateReply();
    await step5_AdvanceToNextStage();
    await step6_TestManualStageAdvancement();
    await step7_TestConnectionReset();
    await step8_TestFollowUpLogic();
    await step9_TestConnectionDeletion();
    
    console.log('\n🎉 All tests completed!'.bold.green);
    log('Test suite finished successfully', 'success');
    
  } catch (error) {
    console.log('\n💥 Test suite failed!'.bold.red);
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Connection Flow Test Script

Usage: node test_connection_flow.js [options]

Options:
  --help, -h    Show this help message
  
This script tests the complete connection lifecycle:
1. Create connection (Not Contacted stage)
2. Generate draft (First Outreach stage)
3. Send email (awaiting_reply status)
4. Simulate reply (positive/negative reply status)
5. Advance stages (Second/Third Outreach)
6. Manual stage advancement
7. Connection reset
8. Follow-up logic
9. Connection deletion

Make sure the server is running on http://localhost:3001 before running tests.
  `);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});