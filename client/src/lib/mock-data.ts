// This file contains mock data for the application
// In a real application, this would be replaced with API calls

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  stage: string;
  lastContactedAt?: string;
  isAlumni: boolean;
  tags: string[];
  notes?: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  purpose: string;
  tone: string;
}

export interface AnalyticsData {
  emailsSent7d: number;
  emailsSent28d: number;
  replyRate: number;
  followupRate: number;
  avgResponseTime: string;
}

export const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@microsoft.com",
    role: "Product Manager",
    company: "Microsoft",
    stage: "First Outreach",
    lastContactedAt: "2 hours ago",
    isAlumni: true,
    tags: ["Alumni", "Product Management"]
  },
  {
    id: "2", 
    name: "David Kim",
    email: "david.kim@google.com",
    role: "Data Scientist",
    company: "Google",
    stage: "Second Outreach",
    lastContactedAt: "3 days ago",
    isAlumni: false,
    tags: ["Data Science"]
  },
  {
    id: "3",
    name: "Alex Rodriguez", 
    email: "alex.rodriguez@tesla.com",
    role: "Engineering Manager",
    company: "Tesla",
    stage: "Follow-up Due",
    lastContactedAt: "5 days ago",
    isAlumni: false,
    tags: ["Engineering"]
  }
];

export const mockAnalytics: AnalyticsData = {
  emailsSent7d: 12,
  emailsSent28d: 47,
  replyRate: 68,
  followupRate: 89,
  avgResponseTime: "2.3d"
};

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "1",
    subject: "Stanford student interested in your product management journey",
    body: "Hi [Name], I hope this email finds you well! I'm Jessica Stone, a junior at Stanford studying Computer Science...",
    purpose: "informational",
    tone: "warm"
  }
];
