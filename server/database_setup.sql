-- Turnship Database Schema Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create OAuthToken table
CREATE TABLE IF NOT EXISTS "OAuthToken" (
  "userId" UUID NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  scope TEXT,
  "expiresAt" TIMESTAMP,
  encrypted BOOLEAN DEFAULT true,
  PRIMARY KEY ("userId", provider),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Profile table
CREATE TABLE IF NOT EXISTS "Profile" (
  "userId" UUID PRIMARY KEY,
  school VARCHAR(255),
  "gradYear" INTEGER,
  major VARCHAR(255),
  interests TEXT[],
  targets TEXT[],
  location VARCHAR(255),
  tone VARCHAR(255) DEFAULT 'Warm',
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  kind VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  "extractedTxt" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Connection table
CREATE TABLE IF NOT EXISTS "Connection" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  email VARCHAR(255),
  "fullName" VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(255),
  location VARCHAR(255),
  tags TEXT[],
  notes TEXT,
  alumni BOOLEAN DEFAULT false,
  school VARCHAR(255),
  "gradYear" INTEGER,
  stage VARCHAR(255) DEFAULT 'Prospected',
  "lastContactedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE ("userId", email)
);

-- Create Draft table
CREATE TABLE IF NOT EXISTS "Draft" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  meta JSONB,
  status VARCHAR(255) DEFAULT 'draft',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("connectionId") REFERENCES "Connection"(id) ON DELETE CASCADE
);

-- Create EmailSent table
CREATE TABLE IF NOT EXISTS "EmailSent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  "gmailMessageId" VARCHAR(255),
  subject VARCHAR(255),
  body TEXT,
  "sentAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("connectionId") REFERENCES "Connection"(id) ON DELETE CASCADE
);

-- Create TimelineEvent table
CREATE TABLE IF NOT EXISTS "TimelineEvent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  kind VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  details JSONB,
  at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("connectionId") REFERENCES "Connection"(id) ON DELETE CASCADE
);

-- Create Followup table
CREATE TABLE IF NOT EXISTS "Followup" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "connectionId" UUID NOT NULL,
  "dueAt" TIMESTAMP NOT NULL,
  status VARCHAR(255) DEFAULT 'scheduled',
  rule VARCHAR(255),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("connectionId") REFERENCES "Connection"(id) ON DELETE CASCADE
);

-- Create Alumni table
CREATE TABLE IF NOT EXISTS "Alumni" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName" VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(255),
  school VARCHAR(255),
  program VARCHAR(255),
  "gradYear" INTEGER,
  location VARCHAR(255),
  source VARCHAR(255),
  notes TEXT
);

-- Create Recommendation table
CREATE TABLE IF NOT EXISTS "Recommendation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "alumniId" UUID NOT NULL,
  score FLOAT,
  reasons JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_connection_userid ON "Connection"("userId");
CREATE INDEX IF NOT EXISTS idx_connection_email ON "Connection"(email);
CREATE INDEX IF NOT EXISTS idx_draft_userid ON "Draft"("userId");
CREATE INDEX IF NOT EXISTS idx_draft_connectionid ON "Draft"("connectionId");
CREATE INDEX IF NOT EXISTS idx_emailsent_userid ON "EmailSent"("userId");
CREATE INDEX IF NOT EXISTS idx_emailsent_connectionid ON "EmailSent"("connectionId");
CREATE INDEX IF NOT EXISTS idx_timeline_userid ON "TimelineEvent"("userId");
CREATE INDEX IF NOT EXISTS idx_timeline_connectionid ON "TimelineEvent"("connectionId");
CREATE INDEX IF NOT EXISTS idx_followup_userid ON "Followup"("userId");
CREATE INDEX IF NOT EXISTS idx_followup_connectionid ON "Followup"("connectionId");
CREATE INDEX IF NOT EXISTS idx_recommendation_userid ON "Recommendation"("userId");