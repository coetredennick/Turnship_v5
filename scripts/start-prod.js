#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Turnship in production mode...\n');

// Check if running on Replit
const isReplit = process.env.REPL_OWNER && process.env.REPLIT_DOMAINS;

// Load environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
}

// Always build client for production
console.log('Building client application...');
try {
  require('child_process').execSync('npm run build', {
    cwd: path.join(__dirname, '../client'),
    stdio: 'inherit'
  });
  console.log('Client build complete!\n');
} catch (error) {
  console.error('Failed to build client:', error);
  process.exit(1);
}

// Start the server (which will serve the built client)
const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '../server'),
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env,
    NODE_ENV: 'production',
    SERVE_STATIC: path.join(__dirname, '../client/dist')
  }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

if (isReplit) {
  const replitDomain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'unknown';
  console.log(`\n🚀 Application running in production mode`);
  console.log(`   URL: https://${replitDomain}\n`);
} else {
  console.log('\n🚀 Application running in production mode');
  console.log('   URL: http://localhost:3001\n');
}