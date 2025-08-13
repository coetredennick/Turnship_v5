#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initDevUser() {
  try {
    // Create or update the dev user
    const devUser = await prisma.user.upsert({
      where: { id: 'dev-user-1' },
      update: {
        email: 'dev@example.com',
        name: 'Dev User'
      },
      create: {
        id: 'dev-user-1',
        email: 'dev@example.com',
        name: 'Dev User'
      }
    });
    
    console.log('✅ Dev user initialized:', devUser);
    
    // Also create a profile for the user if it doesn't exist
    const profile = await prisma.profile.upsert({
      where: { userId: 'dev-user-1' },
      update: {},
      create: {
        userId: 'dev-user-1',
        tone: 'professional',
        interests: [],
        targets: []
      }
    });
    
    console.log('✅ Dev profile initialized:', profile);
    
  } catch (error) {
    console.error('Error initializing dev user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDevUser();