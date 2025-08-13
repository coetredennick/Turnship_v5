#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Turnship in development mode...\n');

// Check if running on Replit
const isReplit = process.env.REPL_OWNER && process.env.REPLIT_DOMAINS;

// Load environment variables from server/.env if DATABASE_URL not set
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
}

// Start the server
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Start the client after a short delay to ensure server is up
setTimeout(() => {
  const clientProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../client'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  clientProcess.on('error', (err) => {
    console.error('Failed to start client:', err);
    process.exit(1);
  });
}, 3000);

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
  console.log(`\n🚀 Application starting...`);
  console.log(`   Backend: https://${replitDomain}:3001`);
  console.log(`   Frontend: https://${replitDomain}\n`);
} else {
  console.log('\n🚀 Application starting...');
  console.log('   Backend: http://localhost:3001');
  console.log('   Frontend: http://localhost:5173\n');
}