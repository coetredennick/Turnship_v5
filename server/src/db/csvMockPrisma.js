const { readCSV, writeCSV, generateId } = require('./csvUtils');

// Mock Connection model with CSV backend
class ConnectionModel {
  constructor() {
    this.data = null;
    this.loadData();
  }

  loadData() {
    this.data = readCSV('connections.csv');
  }

  saveData() {
    writeCSV('connections.csv', this.data);
  }

  // Convert snake_case CSV data to camelCase for API consistency
  convertToApiFormat(item) {
    return {
      id: item.id,
      userId: item.user_id,
      email: item.email,
      fullName: item.full_name,
      company: item.company,
      role: item.role,
      location: item.location,
      tags: item.tags,
      notes: item.notes,
      alumni: item.alumni,
      school: item.school,
      gradYear: item.grad_year,
      stage: item.stage,
      // legacy status fields for UI compatibility (kept but discouraged)
      stageStatus: item.stage_status,
      currentDraftId: item.current_draft_id,
      // new state machine fields
      cycle: item.cycle ?? 1,
      state: item.state ?? 'NOT_CONTACTED',
      nextAction: item.next_action ?? 'PREPARE_FIRST',
      nextActionAt: item.next_action_at ?? null,
      gmailThreadId: item.gmail_thread_id ?? null,
      lastContactedAt: item.last_contacted_at,
      lastReplyAt: item.last_reply_at,
      replySentiment: item.reply_sentiment,
      createdAt: item.created_at
    };
  }

  // Convert camelCase API data to snake_case for CSV storage
  convertToCsvFormat(item) {
    const result = {};
    
    // Only include fields that are defined in the input
    if (item.id !== undefined) result.id = item.id;
    if (item.userId !== undefined) result.user_id = item.userId;
    if (item.email !== undefined) result.email = item.email;
    if (item.fullName !== undefined) result.full_name = item.fullName;
    if (item.company !== undefined) result.company = item.company;
    if (item.role !== undefined) result.role = item.role;
    if (item.location !== undefined) result.location = item.location;
    if (item.tags !== undefined) result.tags = item.tags;
    if (item.notes !== undefined) result.notes = item.notes;
    if (item.alumni !== undefined) result.alumni = item.alumni;
    if (item.school !== undefined) result.school = item.school;
    if (item.gradYear !== undefined) result.grad_year = item.gradYear;
    if (item.stage !== undefined) result.stage = item.stage;
    if (item.stageStatus !== undefined) result.stage_status = item.stageStatus;
    if (item.currentDraftId !== undefined) result.current_draft_id = item.currentDraftId;
    if (item.cycle !== undefined) result.cycle = item.cycle;
    if (item.state !== undefined) result.state = item.state;
    if (item.nextAction !== undefined) result.next_action = item.nextAction;
    if (item.nextActionAt !== undefined) result.next_action_at = item.nextActionAt;
    if (item.gmailThreadId !== undefined) result.gmail_thread_id = item.gmailThreadId;
    if (item.lastContactedAt !== undefined) result.last_contacted_at = item.lastContactedAt;
    if (item.lastReplyAt !== undefined) result.last_reply_at = item.lastReplyAt;
    if (item.replySentiment !== undefined) result.reply_sentiment = item.replySentiment;
    if (item.createdAt !== undefined) result.created_at = item.createdAt;
    
    return result;
  }

  async findMany({ where = {}, orderBy, take, skip } = {}) {
    this.loadData();
    let results = this.data.filter(item => {
      if (where.userId && item.user_id !== where.userId) return false;
      if (where.stage && item.stage !== where.stage) return false;
      if (where.alumni !== undefined && Boolean(item.alumni) !== where.alumni) return false;
      if (where.OR) {
        return where.OR.some(condition => {
          return Object.entries(condition).every(([key, value]) => {
            if (typeof value === 'object' && value.contains) {
              return String(item[key] || '').toLowerCase().includes(value.contains.toLowerCase());
            }
            return item[key] === value;
          });
        });
      }
      return true;
    });

    if (orderBy) {
      results.sort((a, b) => {
        const field = Object.keys(orderBy)[0];
        const direction = orderBy[field];
        if (direction === 'desc') {
          return new Date(b[field]) - new Date(a[field]);
        }
        return new Date(a[field]) - new Date(b[field]);
      });
    }

    if (skip) results = results.slice(skip);
    if (take) results = results.slice(0, take);

    return results.map(item => this.convertToApiFormat(item));
  }

  async findUnique({ where }) {
    this.loadData();
    const item = this.data.find(item => {
      if (where.id) return item.id === where.id;
      if (where.userId_email) {
        return item.user_id === where.userId_email.userId && item.email === where.userId_email.email;
      }
      return false;
    });
    return item ? this.convertToApiFormat(item) : null;
  }

  async findFirst({ where }) {
    this.loadData();
    const item = this.data.find(item => {
      if (where.userId && item.user_id !== where.userId) return false;
      if (where.email && item.email !== where.email) return false;
      if (where.id && item.id !== where.id) return false;
      return true;
    });
    return item ? this.convertToApiFormat(item) : null;
  }

  async create({ data }) {
    this.loadData();
    const newItem = {
      id: data.id || generateId(),
      user_id: data.userId,
      email: data.email || null,
      full_name: data.fullName || null,
      company: data.company || null,
      role: data.role || null,
      location: data.location || null,
      tags: data.tags || null,
      notes: data.notes || null,
      alumni: data.alumni || null,
      school: data.school || null,
      grad_year: data.gradYear || null,
      stage: data.stage || 'Not Contacted',
      stage_status: data.stageStatus || 'ready',
      current_draft_id: data.currentDraftId || null,
      // state machine defaults
      cycle: data.cycle ?? 1,
      state: data.state ?? 'NOT_CONTACTED',
      next_action: data.nextAction ?? 'PREPARE_FIRST',
      next_action_at: data.nextActionAt ?? null,
      gmail_thread_id: data.gmailThreadId ?? null,
      last_contacted_at: data.lastContactedAt || null,
      last_reply_at: data.lastReplyAt || null,
      reply_sentiment: data.replySentiment || null,
      created_at: data.createdAt || new Date().toISOString()
    };
    this.data.push(newItem);
    this.saveData();
    return this.convertToApiFormat(newItem);
  }

  async update({ where, data }) {
    this.loadData();
    const index = this.data.findIndex(item => item.id === where.id);
    if (index === -1) return null;

    // Update item with new data - be careful to preserve existing fields
    const existingItem = this.data[index];
    const convertedData = this.convertToCsvFormat(data);
    
    // Only update fields that are explicitly provided, preserve others
    const updatedItem = { ...existingItem };
    Object.keys(convertedData).forEach(key => {
      if (convertedData[key] !== undefined) {
        updatedItem[key] = convertedData[key];
      }
    });
    
    this.data[index] = updatedItem;
    this.saveData();
    return this.convertToApiFormat(updatedItem);
  }

  async delete({ where }) {
    this.loadData();
    const index = this.data.findIndex(item => item.id === where.id);
    if (index === -1) return null;

    const deletedItem = this.data[index];
    this.data.splice(index, 1);
    this.saveData();
    return this.convertToApiFormat(deletedItem);
  }

  async upsert({ where, update, create }) {
    const existing = await this.findUnique({ where });
    if (existing) {
      return await this.update({ where, data: update });
    } else {
      return await this.create({ data: create });
    }
  }

  async count({ where = {} } = {}) {
    this.loadData();
    return this.data.filter(item => {
      if (where.userId && item.user_id !== where.userId) return false;
      if (where.stage && item.stage !== where.stage) return false;
      if (where.alumni !== undefined && Boolean(item.alumni) !== where.alumni) return false;
      return true;
    }).length;
  }

  async groupBy({ by, where = {}, _count } = {}) {
    this.loadData();
    
    // Apply filters first
    let results = this.data.filter(item => {
      if (where.userId && item.user_id !== where.userId) return false;
      return true;
    });

    // Group by field(s)
    const groups = {};
    results.forEach(item => {
      const groupKey = by.includes('stage') ? item.stage : item[by[0]];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    // Format response to match Prisma's groupBy structure
    return Object.entries(groups).map(([stage, items]) => ({
      stage,
      _count: { stage: items.length }
    }));
  }
}

// Mock TimelineEvent model
class TimelineEventModel {
  constructor() {
    this.events = []; // Store timeline events in memory for CSV mock
  }

  async create({ data }) {
    const newEvent = {
      id: generateId(),
      userId: data.userId,
      connectionId: data.connectionId,
      type: data.kind || data.type || 'note',
      title: data.title,
      description: data.details || data.description || '',
      at: data.at || new Date().toISOString()
    };
    
    this.events.push(newEvent);
    console.log('Timeline Event Created:', newEvent);
    return newEvent;
  }

  async findMany({ where = {}, orderBy, take } = {}) {
    let results = this.events.filter(event => {
      if (where.userId && event.userId !== where.userId) return false;
      if (where.connectionId && event.connectionId !== where.connectionId) return false;
      return true;
    });

    if (orderBy) {
      results.sort((a, b) => {
        const field = Object.keys(orderBy)[0];
        const direction = orderBy[field];
        if (direction === 'desc') {
          return new Date(b[field]) - new Date(a[field]);
        }
        return new Date(a[field]) - new Date(b[field]);
      });
    }

    if (take) results = results.slice(0, take);
    return results;
  }
}

// Mock Followup model
class FollowupModel {
  constructor() {
    this.followups = []; // Store in memory for CSV mock
  }

  async create({ data }) {
    const newFollowup = {
      id: generateId(),
      userId: data.userId,
      connectionId: data.connectionId,
      dueAt: data.dueAt,
      status: data.status || 'scheduled',
      rule: data.rule || null
    };
    
    this.followups.push(newFollowup);
    console.log('Created followup:', newFollowup);
    return newFollowup;
  }

  async findMany({ where = {}, include, orderBy } = {}) {
    let results = this.followups.filter(followup => {
      if (where.userId && followup.userId !== where.userId) return false;
      if (where.status && followup.status !== where.status) return false;
      if (where.dueAt && where.dueAt.lte) {
        return new Date(followup.dueAt) <= where.dueAt.lte;
      }
      return true;
    });

    if (orderBy) {
      results.sort((a, b) => {
        const field = Object.keys(orderBy)[0];
        const direction = orderBy[field];
        if (direction === 'desc') {
          return new Date(b[field]) - new Date(a[field]);
        }
        return new Date(a[field]) - new Date(b[field]);
      });
    }

    // Mock include connection data
    if (include?.connection) {
      const connectionModel = new ConnectionModel();
      results = await Promise.all(results.map(async (followup) => {
        const connection = await connectionModel.findUnique({ where: { id: followup.connectionId } });
        return { ...followup, connection };
      }));
    }

    return results;
  }
}

// Mock User model (minimal implementation)
class UserModel {
  async findUnique({ where }) {
    // Return mock user for development
    if (where.id === 'dev-user-1') {
      return {
        id: 'dev-user-1',
        email: 'dev@example.com',
        name: 'Dev User'
      };
    }
    return null;
  }
}

// Mock Profile model
class ProfileModel {
  constructor() {
    // Store profile data in memory
    this.profiles = new Map();
    
    // Initialize with default profile for dev user
    this.profiles.set('dev-user-1', {
      userId: 'dev-user-1',
      school: 'Stanford University',
      gradYear: 2020,
      major: 'Computer Science',
      interests: ['Technology', 'Product Management'],
      targets: ['FAANG', 'Startups'],
      location: 'San Francisco Bay Area',
      tone: 'warm'
    });
  }

  async findUnique({ where }) {
    return this.profiles.get(where.userId) || null;
  }

  async upsert({ where, update, create }) {
    const existingProfile = this.profiles.get(where.userId);
    
    if (existingProfile) {
      // Update existing profile
      const updatedProfile = { ...existingProfile, ...update };
      this.profiles.set(where.userId, updatedProfile);
      console.log('Profile updated:', updatedProfile);
      return updatedProfile;
    } else {
      // Create new profile
      const newProfile = { userId: where.userId, ...create };
      this.profiles.set(where.userId, newProfile);
      console.log('Profile created:', newProfile);
      return newProfile;
    }
  }
}

// Mock EmailSent model
class EmailSentModel {
  constructor() {
    this.emails = [];
  }

  async create({ data }) {
    const newEmail = {
      id: generateId(),
      userId: data.userId,
      connectionId: data.connectionId,
      gmailMessageId: data.gmailMessageId,
      subject: data.subject,
      body: data.body,
      idempotencyKey: data.idempotencyKey,
      sentAt: data.sentAt || new Date().toISOString()
    };
    
    this.emails.push(newEmail);
    console.log('Email sent record created:', newEmail);
    return newEmail;
  }

  async findUnique({ where }) {
    if (where.userId_idempotencyKey) {
      return this.emails.find(email => 
        email.userId === where.userId_idempotencyKey.userId && 
        email.idempotencyKey === where.userId_idempotencyKey.idempotencyKey
      ) || null;
    }
    return this.emails.find(email => email.id === where.id) || null;
  }

  async findFirst({ where, orderBy }) {
    let results = this.emails.filter(email => {
      if (where.userId && email.userId !== where.userId) return false;
      if (where.connectionId && email.connectionId !== where.connectionId) return false;
      return true;
    });

    if (orderBy?.sentAt === 'desc') {
      results.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    }

    return results[0] || null;
  }

  async count({ where }) {
    return this.emails.filter(email => {
      if (where.userId && email.userId !== where.userId) return false;
      if (where.sentAt?.gte && new Date(email.sentAt) < where.sentAt.gte) return false;
      return true;
    }).length;
  }
}

// Mock Draft model
class DraftModel {
  constructor() {
    this.drafts = []; // Store drafts in memory
  }

  async create({ data }) {
    const newDraft = {
      id: generateId(),
      userId: data.userId,
      connectionId: data.connectionId,
      subject: data.subject,
      body: data.body,
      meta: data.meta || {},
      status: data.status || 'draft',
      createdAt: new Date().toISOString()
    };
    
    this.drafts.push(newDraft);
    
    // Update connection's stage_status and current_draft_id
    const connectionModel = new ConnectionModel();
    await connectionModel.update({ 
      where: { id: data.connectionId },
      data: { 
        stageStatus: 'draft_saved',
        currentDraftId: newDraft.id
      }
    });
    
    console.log('Draft created:', newDraft);
    return newDraft;
  }

  async findUnique({ where, include }) {
    const draft = this.drafts.find(d => d.id === where.id);
    if (!draft) return null;
    
    if (include?.connection) {
      const connectionModel = new ConnectionModel();
      const connection = await connectionModel.findUnique({ where: { id: draft.connectionId } });
      return { ...draft, connection };
    }
    
    return draft;
  }

  async findMany({ where = {}, include, orderBy }) {
    let results = this.drafts.filter(draft => {
      if (where.userId && draft.userId !== where.userId) return false;
      if (where.status && draft.status !== where.status) return false;
      if (where.connectionId && draft.connectionId !== where.connectionId) return false;
      return true;
    });

    if (orderBy?.createdAt === 'desc') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (include?.connection) {
      const connectionModel = new ConnectionModel();
      results = await Promise.all(results.map(async (draft) => {
        const connection = await connectionModel.findUnique({ where: { id: draft.connectionId } });
        return { ...draft, connection };
      }));
    }

    return results;
  }

  async delete({ where }) {
    const index = this.drafts.findIndex(d => d.id === where.id);
    if (index === -1) return null;
    
    const draft = this.drafts[index];
    
    // If this was the current draft for a connection, update the connection
    if (draft.status === 'draft' && draft.connectionId) {
      const connectionModel = new ConnectionModel();
      await connectionModel.update({
        where: { id: draft.connectionId },
        data: { 
          stageStatus: 'ready',
          currentDraftId: null
        }
      });
    }
    
    this.drafts.splice(index, 1);
    console.log('Draft deleted:', draft.id);
    return draft;
  }

  async update({ where, data }) {
    const index = this.drafts.findIndex(d => d.id === where.id);
    if (index === -1) return null;
    
    this.drafts[index] = { ...this.drafts[index], ...data };
    console.log('Draft updated:', where.id, data);
    
    // If draft is sent, update connection stage_status
    if (data.status === 'sent') {
      const draft = this.drafts[index];
      const connectionModel = new ConnectionModel();
      await connectionModel.update({
        where: { id: draft.connectionId },
        data: { 
          stageStatus: 'waiting',
          currentDraftId: null
        }
      });
    }
    
    return this.drafts[index];
  }

  async deleteMany({ where }) {
    let deletedCount = 0;
    const draftIndexesToDelete = [];
    
    // Find all drafts matching the where criteria
    this.drafts.forEach((draft, index) => {
      let matches = true;
      if (where.userId && draft.userId !== where.userId) matches = false;
      if (where.connectionId && draft.connectionId !== where.connectionId) matches = false;
      if (where.status && draft.status !== where.status) matches = false;
      
      if (matches) {
        draftIndexesToDelete.push(index);
      }
    });
    
    // Delete drafts in reverse order to maintain correct indices
    for (let i = draftIndexesToDelete.length - 1; i >= 0; i--) {
      const index = draftIndexesToDelete[i];
      const draft = this.drafts[index];
      
      // If this was the current draft for a connection, update the connection
      if (draft.status === 'draft' && draft.connectionId) {
        const connectionModel = new ConnectionModel();
        await connectionModel.update({
          where: { id: draft.connectionId },
          data: { 
            stageStatus: 'ready',
            currentDraftId: null
          }
        });
      }
      
      this.drafts.splice(index, 1);
      deletedCount++;
    }
    
    console.log(`Deleted ${deletedCount} drafts matching criteria`);
    return { count: deletedCount };
  }
}

// Mock Alumni model
class AlumniModel {
  constructor() {
    // Store 50 diverse alumni profiles
    this.alumni = [
      // Tech Industry
      { id: 'alum_1', name: 'Sarah Chen', email: 'sarah.chen@meta.com', company: 'Meta', role: 'Senior Software Engineer', location: 'Menlo Park, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2019, industry: 'Technology', skills: ['React', 'Machine Learning', 'Leadership'], score: 0 },
      { id: 'alum_2', name: 'Marcus Johnson', email: 'marcus.j@google.com', company: 'Google', role: 'Product Manager', location: 'Mountain View, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2018, industry: 'Technology', skills: ['Product Strategy', 'Data Analysis', 'User Research'], score: 0 },
      { id: 'alum_3', name: 'Emily Rodriguez', email: 'emily.r@apple.com', company: 'Apple', role: 'UX Designer', location: 'Cupertino, CA', school: 'Stanford University', program: 'Design', gradYear: 2020, industry: 'Technology', skills: ['UI/UX', 'Prototyping', 'Design Systems'], score: 0 },
      { id: 'alum_4', name: 'David Kim', email: 'david.kim@amazon.com', company: 'Amazon', role: 'Data Scientist', location: 'Seattle, WA', school: 'Stanford University', program: 'Statistics', gradYear: 2017, industry: 'Technology', skills: ['Python', 'SQL', 'Machine Learning'], score: 0 },
      { id: 'alum_5', name: 'Jessica Liu', email: 'jessica.liu@netflix.com', company: 'Netflix', role: 'Engineering Manager', location: 'Los Gatos, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2016, industry: 'Technology', skills: ['Team Leadership', 'System Design', 'Streaming Tech'], score: 0 },
      
      // Finance
      { id: 'alum_6', name: 'Michael Brown', email: 'michael.brown@goldmansachs.com', company: 'Goldman Sachs', role: 'Investment Banker', location: 'New York, NY', school: 'Stanford University', program: 'Economics', gradYear: 2019, industry: 'Finance', skills: ['Financial Modeling', 'M&A', 'Client Relations'], score: 0 },
      { id: 'alum_7', name: 'Amanda Wilson', email: 'amanda.w@blackrock.com', company: 'BlackRock', role: 'Portfolio Manager', location: 'New York, NY', school: 'Stanford University', program: 'Economics', gradYear: 2018, industry: 'Finance', skills: ['Asset Management', 'Risk Analysis', 'Market Research'], score: 0 },
      { id: 'alum_8', name: 'Robert Chen', email: 'robert.chen@jpmorgan.com', company: 'JPMorgan Chase', role: 'Quantitative Analyst', location: 'New York, NY', school: 'Stanford University', program: 'Mathematics', gradYear: 2020, industry: 'Finance', skills: ['Quantitative Analysis', 'Python', 'Financial Modeling'], score: 0 },
      { id: 'alum_9', name: 'Lauren Davis', email: 'lauren.davis@citadel.com', company: 'Citadel', role: 'Trader', location: 'Chicago, IL', school: 'Stanford University', program: 'Economics', gradYear: 2021, industry: 'Finance', skills: ['Trading', 'Risk Management', 'Market Analysis'], score: 0 },
      { id: 'alum_10', name: 'Kevin Park', email: 'kevin.park@sequoiacap.com', company: 'Sequoia Capital', role: 'Principal', location: 'Menlo Park, CA', school: 'Stanford University', program: 'Business', gradYear: 2015, industry: 'Venture Capital', skills: ['Due Diligence', 'Portfolio Management', 'Startup Evaluation'], score: 0 },
      
      // Consulting
      { id: 'alum_11', name: 'Sophia Martinez', email: 'sophia.martinez@mckinsey.com', company: 'McKinsey & Company', role: 'Associate', location: 'San Francisco, CA', school: 'Stanford University', program: 'Economics', gradYear: 2022, industry: 'Consulting', skills: ['Strategy Consulting', 'Data Analysis', 'Client Presentations'], score: 0 },
      { id: 'alum_12', name: 'James Thompson', email: 'james.t@bain.com', company: 'Bain & Company', role: 'Consultant', location: 'Boston, MA', school: 'Stanford University', program: 'Business', gradYear: 2021, industry: 'Consulting', skills: ['Business Strategy', 'Process Improvement', 'Leadership'], score: 0 },
      { id: 'alum_13', name: 'Rachel Green', email: 'rachel.green@bcg.com', company: 'Boston Consulting Group', role: 'Project Leader', location: 'Los Angeles, CA', school: 'Stanford University', program: 'Economics', gradYear: 2017, industry: 'Consulting', skills: ['Digital Transformation', 'Change Management', 'Analytics'], score: 0 },
      { id: 'alum_14', name: 'Christopher Lee', email: 'chris.lee@deloitte.com', company: 'Deloitte', role: 'Senior Consultant', location: 'Chicago, IL', school: 'Stanford University', program: 'Business', gradYear: 2019, industry: 'Consulting', skills: ['Technology Consulting', 'Process Optimization', 'Client Management'], score: 0 },
      { id: 'alum_15', name: 'Nicole Wang', email: 'nicole.wang@pwc.com', company: 'PwC', role: 'Manager', location: 'New York, NY', school: 'Stanford University', program: 'Accounting', gradYear: 2018, industry: 'Consulting', skills: ['Financial Advisory', 'Risk Management', 'Audit'], score: 0 },
      
      // Healthcare & Biotech
      { id: 'alum_16', name: 'Dr. Andrew Miller', email: 'andrew.miller@genentech.com', company: 'Genentech', role: 'Research Scientist', location: 'South San Francisco, CA', school: 'Stanford University', program: 'Biology', gradYear: 2016, industry: 'Biotech', skills: ['Drug Development', 'Clinical Research', 'Molecular Biology'], score: 0 },
      { id: 'alum_17', name: 'Dr. Maria Gonzalez', email: 'maria.gonzalez@pfizer.com', company: 'Pfizer', role: 'Clinical Data Manager', location: 'New York, NY', school: 'Stanford University', program: 'Biology', gradYear: 2019, industry: 'Pharma', skills: ['Clinical Trials', 'Data Management', 'Regulatory Affairs'], score: 0 },
      { id: 'alum_18', name: 'Thomas Anderson', email: 'thomas.a@moderna.com', company: 'Moderna', role: 'Process Engineer', location: 'Cambridge, MA', school: 'Stanford University', program: 'Chemical Engineering', gradYear: 2020, industry: 'Biotech', skills: ['Manufacturing', 'Process Development', 'Quality Control'], score: 0 },
      { id: 'alum_19', name: 'Lisa Zhang', email: 'lisa.zhang@23andme.com', company: '23andMe', role: 'Computational Biologist', location: 'Sunnyvale, CA', school: 'Stanford University', program: 'Computational Biology', gradYear: 2021, industry: 'Genomics', skills: ['Bioinformatics', 'Python', 'Genomic Analysis'], score: 0 },
      { id: 'alum_20', name: 'Dr. Benjamin Carter', email: 'ben.carter@ucsf.edu', company: 'UCSF Medical Center', role: 'Resident Physician', location: 'San Francisco, CA', school: 'Stanford University', program: 'Pre-Med', gradYear: 2018, industry: 'Healthcare', skills: ['Clinical Medicine', 'Patient Care', 'Medical Research'], score: 0 },
      
      // Startups & Entrepreneurship
      { id: 'alum_21', name: 'Alex Turner', email: 'alex.turner@stripe.com', company: 'Stripe', role: 'Software Engineer', location: 'San Francisco, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2022, industry: 'Fintech', skills: ['Backend Development', 'Payment Systems', 'API Design'], score: 0 },
      { id: 'alum_22', name: 'Maya Patel', email: 'maya.patel@airbnb.com', company: 'Airbnb', role: 'Product Designer', location: 'San Francisco, CA', school: 'Stanford University', program: 'Design', gradYear: 2020, industry: 'Travel Tech', skills: ['Product Design', 'User Research', 'Design Thinking'], score: 0 },
      { id: 'alum_23', name: 'Jordan Williams', email: 'jordan.w@uber.com', company: 'Uber', role: 'Data Engineer', location: 'San Francisco, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2019, industry: 'Transportation', skills: ['Big Data', 'ETL Pipelines', 'Machine Learning'], score: 0 },
      { id: 'alum_24', name: 'Samantha Lee', email: 'sam.lee@doordash.com', company: 'DoorDash', role: 'Operations Manager', location: 'San Francisco, CA', school: 'Stanford University', program: 'Industrial Engineering', gradYear: 2021, industry: 'Food Delivery', skills: ['Operations', 'Logistics', 'Data Analysis'], score: 0 },
      { id: 'alum_25', name: 'Daniel Kim', email: 'daniel.kim@zoom.us', company: 'Zoom', role: 'Backend Engineer', location: 'San Jose, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2020, industry: 'Video Conferencing', skills: ['Distributed Systems', 'Video Technology', 'Scalability'], score: 0 },
      
      // Media & Entertainment
      { id: 'alum_26', name: 'Isabella Garcia', email: 'isabella.garcia@disney.com', company: 'Disney', role: 'Creative Producer', location: 'Burbank, CA', school: 'Stanford University', program: 'Film Studies', gradYear: 2018, industry: 'Entertainment', skills: ['Content Production', 'Project Management', 'Creative Direction'], score: 0 },
      { id: 'alum_27', name: 'Ryan O\'Connor', email: 'ryan.oconnor@netflix.com', company: 'Netflix', role: 'Content Strategist', location: 'Los Angeles, CA', school: 'Stanford University', program: 'Communications', gradYear: 2019, industry: 'Streaming', skills: ['Content Strategy', 'Market Research', 'Data Analysis'], score: 0 },
      { id: 'alum_28', name: 'Zoe Mitchell', email: 'zoe.mitchell@spotify.com', company: 'Spotify', role: 'Music Data Analyst', location: 'New York, NY', school: 'Stanford University', program: 'Music Technology', gradYear: 2021, industry: 'Music Streaming', skills: ['Music Analytics', 'Machine Learning', 'User Behavior'], score: 0 },
      { id: 'alum_29', name: 'Carlos Rodriguez', email: 'carlos.r@hulu.com', company: 'Hulu', role: 'Software Engineer', location: 'Santa Monica, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2020, industry: 'Streaming', skills: ['Frontend Development', 'Video Streaming', 'React'], score: 0 },
      { id: 'alum_30', name: 'Hannah Foster', email: 'hannah.foster@buzzfeed.com', company: 'BuzzFeed', role: 'Social Media Manager', location: 'New York, NY', school: 'Stanford University', program: 'Communications', gradYear: 2022, industry: 'Digital Media', skills: ['Social Media', 'Content Marketing', 'Analytics'], score: 0 },
      
      // Energy & Sustainability
      { id: 'alum_31', name: 'Trevor Johnson', email: 'trevor.j@tesla.com', company: 'Tesla', role: 'Battery Engineer', location: 'Fremont, CA', school: 'Stanford University', program: 'Materials Science', gradYear: 2019, industry: 'Electric Vehicles', skills: ['Battery Technology', 'Materials Engineering', 'Sustainability'], score: 0 },
      { id: 'alum_32', name: 'Grace Wong', email: 'grace.wong@nextera.com', company: 'NextEra Energy', role: 'Renewable Energy Analyst', location: 'Juno Beach, FL', school: 'Stanford University', program: 'Environmental Engineering', gradYear: 2020, industry: 'Renewable Energy', skills: ['Solar Energy', 'Financial Modeling', 'Project Development'], score: 0 },
      { id: 'alum_33', name: 'Marcus Thompson', email: 'marcus.t@shell.com', company: 'Shell', role: 'Energy Transition Manager', location: 'Houston, TX', school: 'Stanford University', program: 'Chemical Engineering', gradYear: 2017, industry: 'Energy', skills: ['Energy Strategy', 'Carbon Management', 'Project Management'], score: 0 },
      { id: 'alum_34', name: 'Elena Vasquez', email: 'elena.v@bp.com', company: 'BP', role: 'Sustainability Consultant', location: 'Houston, TX', school: 'Stanford University', program: 'Environmental Science', gradYear: 2021, industry: 'Energy', skills: ['Sustainability', 'Environmental Impact', 'Consulting'], score: 0 },
      { id: 'alum_35', name: 'Adam Chen', email: 'adam.chen@ge.com', company: 'General Electric', role: 'Wind Energy Engineer', location: 'Boston, MA', school: 'Stanford University', program: 'Mechanical Engineering', gradYear: 2018, industry: 'Renewable Energy', skills: ['Wind Technology', 'Mechanical Design', 'Data Analysis'], score: 0 },
      
      // Government & Non-Profit
      { id: 'alum_36', name: 'Jennifer Adams', email: 'jennifer.adams@state.gov', company: 'U.S. State Department', role: 'Foreign Service Officer', location: 'Washington, DC', school: 'Stanford University', program: 'International Relations', gradYear: 2019, industry: 'Government', skills: ['Diplomacy', 'Policy Analysis', 'Cultural Competency'], score: 0 },
      { id: 'alum_37', name: 'Michael Scott', email: 'michael.scott@treasury.gov', company: 'U.S. Treasury', role: 'Economic Analyst', location: 'Washington, DC', school: 'Stanford University', program: 'Economics', gradYear: 2020, industry: 'Government', skills: ['Economic Analysis', 'Policy Research', 'Financial Markets'], score: 0 },
      { id: 'alum_38', name: 'Sarah Williams', email: 'sarah.w@gatesfoundation.org', company: 'Gates Foundation', role: 'Program Officer', location: 'Seattle, WA', school: 'Stanford University', program: 'Public Policy', gradYear: 2018, industry: 'Non-Profit', skills: ['Program Management', 'Global Health', 'Impact Measurement'], score: 0 },
      { id: 'alum_39', name: 'David Martinez', email: 'david.m@redcross.org', company: 'American Red Cross', role: 'Emergency Response Coordinator', location: 'Washington, DC', school: 'Stanford University', program: 'Emergency Management', gradYear: 2021, industry: 'Non-Profit', skills: ['Emergency Response', 'Disaster Relief', 'Team Coordination'], score: 0 },
      { id: 'alum_40', name: 'Lisa Park', email: 'lisa.park@teachforamerica.org', company: 'Teach for America', role: 'Regional Director', location: 'Oakland, CA', school: 'Stanford University', program: 'Education', gradYear: 2016, industry: 'Education', skills: ['Educational Leadership', 'Program Development', 'Community Engagement'], score: 0 },
      
      // Academia & Research
      { id: 'alum_41', name: 'Dr. Jonathan Liu', email: 'jonathan.liu@stanford.edu', company: 'Stanford University', role: 'Postdoctoral Researcher', location: 'Stanford, CA', school: 'Stanford University', program: 'Physics', gradYear: 2019, industry: 'Academia', skills: ['Quantum Computing', 'Research', 'Scientific Writing'], score: 0 },
      { id: 'alum_42', name: 'Dr. Rachel Kim', email: 'rachel.kim@mit.edu', company: 'MIT', role: 'Assistant Professor', location: 'Cambridge, MA', school: 'Stanford University', program: 'Computer Science', gradYear: 2015, industry: 'Academia', skills: ['Machine Learning', 'Teaching', 'Research'], score: 0 },
      { id: 'alum_43', name: 'Dr. Steven Brown', email: 'steven.brown@harvard.edu', company: 'Harvard University', role: 'Research Scientist', location: 'Cambridge, MA', school: 'Stanford University', program: 'Neuroscience', gradYear: 2017, industry: 'Research', skills: ['Neuroscience', 'Data Analysis', 'Grant Writing'], score: 0 },
      { id: 'alum_44', name: 'Dr. Anna Rodriguez', email: 'anna.r@ucsf.edu', company: 'UCSF', role: 'Principal Investigator', location: 'San Francisco, CA', school: 'Stanford University', program: 'Biomedical Engineering', gradYear: 2014, industry: 'Medical Research', skills: ['Biomedical Research', 'Lab Management', 'Clinical Translation'], score: 0 },
      { id: 'alum_45', name: 'Dr. Mark Wilson', email: 'mark.wilson@caltech.edu', company: 'Caltech', role: 'Research Fellow', location: 'Pasadena, CA', school: 'Stanford University', program: 'Aerospace Engineering', gradYear: 2020, industry: 'Research', skills: ['Aerospace Engineering', 'Simulation', 'Computational Modeling'], score: 0 },
      
      // Additional Diverse Profiles
      { id: 'alum_46', name: 'Patricia Lee', email: 'patricia.lee@accenture.com', company: 'Accenture', role: 'Technology Consultant', location: 'Seattle, WA', school: 'Stanford University', program: 'Information Systems', gradYear: 2022, industry: 'Consulting', skills: ['Digital Transformation', 'Cloud Computing', 'Project Management'], score: 0 },
      { id: 'alum_47', name: 'Roberto Sanchez', email: 'roberto.s@salesforce.com', company: 'Salesforce', role: 'Solutions Architect', location: 'San Francisco, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2019, industry: 'Enterprise Software', skills: ['CRM Solutions', 'Cloud Architecture', 'Customer Success'], score: 0 },
      { id: 'alum_48', name: 'Catherine Chang', email: 'catherine.chang@nvidia.com', company: 'NVIDIA', role: 'AI Research Engineer', location: 'Santa Clara, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2021, industry: 'AI/Graphics', skills: ['Deep Learning', 'GPU Computing', 'Computer Vision'], score: 0 },
      { id: 'alum_49', name: 'Brian O\'Sullivan', email: 'brian.os@palantir.com', company: 'Palantir', role: 'Forward Deployed Engineer', location: 'Palo Alto, CA', school: 'Stanford University', program: 'Computer Science', gradYear: 2020, industry: 'Data Analytics', skills: ['Data Engineering', 'Customer Deployment', 'Problem Solving'], score: 0 },
      { id: 'alum_50', name: 'Priya Sharma', email: 'priya.sharma@vmware.com', company: 'VMware', role: 'Cloud Engineer', location: 'Palo Alto, CA', school: 'Stanford University', program: 'Computer Engineering', gradYear: 2021, industry: 'Cloud Computing', skills: ['Cloud Infrastructure', 'Virtualization', 'DevOps'], score: 0 }
    ];
  }

  async findMany({ take = 1000, where = {} } = {}) {
    // Apply basic filtering if needed
    let results = [...this.alumni];
    
    // If searching by school, location, etc.
    if (where.school) {
      results = results.filter(a => a.school?.toLowerCase().includes(where.school.toLowerCase()));
    }
    
    // Limit results
    if (take) {
      results = results.slice(0, take);
    }
    
    return results;
  }

  async findUnique({ where }) {
    return this.alumni.find(a => a.id === where.id) || null;
  }

  // Search and filter method for recommendations
  async search({ query = '', industry = '', location = '', take = 50 } = {}) {
    let results = [...this.alumni];
    
    // Filter by query (name, company, role)
    if (query) {
      results = results.filter(a => 
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.company.toLowerCase().includes(query.toLowerCase()) ||
        a.role.toLowerCase().includes(query.toLowerCase()) ||
        a.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Filter by industry
    if (industry && industry !== 'all') {
      results = results.filter(a => a.industry.toLowerCase() === industry.toLowerCase());
    }
    
    // Filter by location
    if (location && location !== 'all') {
      results = results.filter(a => a.location.toLowerCase().includes(location.toLowerCase()));
    }
    
    return results.slice(0, take);
  }
}

// CSV-based mock Prisma client for development
class CSVMockPrisma {
  constructor() {
    // Initialize with data from CSV files
    this.connection = new ConnectionModel();
    this.user = new UserModel();
    this.profile = new ProfileModel();
    this.emailSent = new EmailSentModel();
    this.timelineEvent = new TimelineEventModel();
    this.followup = new FollowupModel();
    this.draft = new DraftModel();
    this.alumni = new AlumniModel();
    this.$queryRaw = async () => [{ result: 1 }]; // Mock for health checks
  }

  // Mock transaction method - just passes through to the same instance
  async $transaction(callback) {
    return await callback(this);
  }
}

const csvMockPrisma = new CSVMockPrisma();

module.exports = { csvMockPrisma };