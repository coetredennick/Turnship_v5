#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up Turnship for Replit...\n');

// Check if running on Replit
const isReplit = process.env.REPL_OWNER && process.env.REPLIT_DOMAINS;

if (!isReplit) {
  console.log('Not running on Replit. Skipping Replit-specific setup.');
  process.exit(0);
}

// Create necessary directories
const dirs = [
  path.join(__dirname, '../server/prisma/migrations'),
  path.join(__dirname, '../client/dist')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Setup environment variables for server
const serverEnvPath = path.join(__dirname, '../server/.env');
if (!fs.existsSync(serverEnvPath)) {
  // Extract the actual domain from REPLIT_DOMAINS
  const replitDomain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost';
  const replitUrl = replitDomain.includes('localhost') ? 'http://localhost' : `https://${replitDomain}`;
  
  const serverEnvContent = `# Server Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=${replitUrl}
SESSION_SECRET=${generateSecret()}

# Database - Replit PostgreSQL
# You need to set DATABASE_URL in Replit Secrets
# Get it from: https://replit.com/@${process.env.REPL_OWNER}/workspace/secrets
# Format: postgresql://username:password@host/database

# OpenAI API Key (set in Replit Secrets)
# OPENAI_API_KEY=your-key-here

# Google OAuth (optional - set in Replit Secrets if needed)
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret
# GOOGLE_REDIRECT_URI=${replitUrl}/auth/google/callback
`;

  fs.writeFileSync(serverEnvPath, serverEnvContent);
  console.log('Created server/.env file');
}

// Setup environment variables for client
const clientEnvPath = path.join(__dirname, '../client/.env');
if (!fs.existsSync(clientEnvPath) || process.env.REPL_OWNER) {
  // Extract the actual domain from REPLIT_DOMAINS
  const replitDomain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost';
  const replitUrl = replitDomain.includes('localhost') ? 'http://localhost:3001' : `https://${replitDomain}`;
  
  const clientEnvContent = `VITE_API_URL=${replitUrl}/api
VITE_BUILD_ID=workspace
`;

  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('Created/Updated client/.env file');
}

// Check for DATABASE_URL in environment
if (!process.env.DATABASE_URL) {
  console.log('\n⚠️  WARNING: DATABASE_URL not found in environment variables!');
  console.log('\nTo set up PostgreSQL on Replit:');
  console.log('1. Go to the "Tools" section in your Replit workspace');
  console.log('2. Search for "PostgreSQL" and add it to your Repl');
  console.log('3. Once added, Replit will automatically set the DATABASE_URL secret');
  console.log('4. Re-run this setup script after PostgreSQL is added\n');
  
  console.log('Alternatively, you can manually add DATABASE_URL to Secrets:');
  console.log(`   https://replit.com/@${process.env.REPL_OWNER}/${process.env.REPL_SLUG}/secrets\n`);
} else {
  console.log('✓ DATABASE_URL found in environment');
}

// Check for OPENAI_API_KEY
if (!process.env.OPENAI_API_KEY) {
  console.log('\n⚠️  WARNING: OPENAI_API_KEY not found!');
  console.log('Add it to Replit Secrets for email generation features to work:');
  console.log(`   https://replit.com/@${process.env.REPL_OWNER}/${process.env.REPL_SLUG}/secrets\n`);
}

console.log('\n✅ Setup complete!');
console.log('\nNext steps:');
console.log('1. Ensure PostgreSQL is added to your Repl (Tools → PostgreSQL)');
console.log('2. Add OPENAI_API_KEY to Secrets (required for email features)');
console.log('3. Run: npm run install:all');
console.log('4. Run: npm run prisma:push (to create database tables)');
console.log('5. Run: npm run dev (to start the application)\n');

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}