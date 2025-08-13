const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildRFC822({ to, from, subject, body }) {
  const crlf = "\r\n";
  const msg = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    body
  ].join(crlf);
  return Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail({ userId, to, subject, body }) {
  // Mock email sending for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 MOCK EMAIL SENT:');
    console.log('  To:', to);
    console.log('  Subject:', subject);
    console.log('  Body preview:', body.substring(0, 100) + '...');
    
    // Generate a fake Gmail message ID
    const mockGmailMessageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      gmailMessageId: mockGmailMessageId,
      from: 'dev@example.com'
    };
  }
  
  // Real Gmail API for production
  const token = await prisma.oAuthToken.findUnique({ where: { userId_provider: { userId, provider: 'google' } } });
  if (!token) throw new Error("Missing Google token");

  const oauth2Client = new (require('googleapis').google.auth.OAuth2)(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: token.accessToken, refresh_token: token.refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  const raw = buildRFC822({ to, from: profile.data.emailAddress, subject, body });
  const r = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return { gmailMessageId: r.data.id, from: profile.data.emailAddress };
}

// Check for replies to sent emails
async function checkForReplies(userId) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 MOCK: Checking for replies for user:', userId);
    
    // Simulate finding replies with various sentiments
    const replyScenarios = [
      {
        from: 'sarah.chen@meta.com',
        subject: 'Re: Stanford CS alum connecting',
        snippet: 'Thanks for reaching out! I\'d be happy to share my experience at Meta. Let\'s schedule a call!',
        sentiment: 'positive'
      },
      {
        from: 'marcus.j@google.com',
        subject: 'Re: Fellow Stanford CS grad',
        snippet: 'Hi there! Always happy to help a fellow Stanford alum. Would love to chat about product management.',
        sentiment: 'positive'
      },
      {
        from: 'emily.r@apple.com',
        subject: 'Re: Design career discussion',
        snippet: 'I appreciate you reaching out, but I\'m pretty swamped with work right now. Maybe in a few months?',
        sentiment: 'negative'
      },
      {
        from: 'david.kim@amazon.com',
        subject: 'Re: Data science career path',
        snippet: 'Thanks for the message. I can provide some brief insights over email if that works.',
        sentiment: 'neutral'
      }
    ];
    
    // Randomly return 0-2 replies to simulate realistic reply rates
    const numReplies = Math.floor(Math.random() * 3);
    const selectedReplies = replyScenarios
      .sort(() => Math.random() - 0.5)
      .slice(0, numReplies)
      .map((reply, index) => ({
        messageId: `mock_reply_${Date.now()}_${index}`,
        originalMessageId: `sent_msg_${index}`,
        from: reply.from,
        subject: reply.subject,
        snippet: reply.snippet,
        receivedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Within last 24 hours
        sentiment: reply.sentiment
      }));
    
    if (selectedReplies.length > 0) {
      console.log(`📧 MOCK: Found ${selectedReplies.length} replies:`);
      selectedReplies.forEach(reply => {
        console.log(`  - ${reply.from}: ${reply.sentiment} sentiment`);
      });
    }
    
    return selectedReplies;
  }
  
  // Real Gmail API implementation would go here
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  // ... real implementation
  return [];
}

// Analyze reply sentiment (positive/neutral/negative)
function analyzeReplySentiment(content) {
  const positiveKeywords = ['happy', 'glad', 'excited', 'interested', 'thanks', 'appreciate', 'love', 'great'];
  const negativeKeywords = ['busy', 'not interested', 'can\'t', 'won\'t', 'no time', 'unavailable'];
  
  const lowerContent = content.toLowerCase();
  
  const positiveScore = positiveKeywords.filter(word => lowerContent.includes(word)).length;
  const negativeScore = negativeKeywords.filter(word => lowerContent.includes(word)).length;
  
  if (positiveScore > negativeScore && positiveScore > 0) return 'positive';
  if (negativeScore > positiveScore && negativeScore > 0) return 'negative';
  return 'neutral';
}

module.exports = { sendEmail, checkForReplies, analyzeReplySentiment };
