const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  fromUser: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'document', 'sticker'],
    default: 'text'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userPhone: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Cliente'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'escalated', 'timeout'],
    default: 'active',
    index: true
  },
  currentFlow: {
    type: String,
    enum: ['greeting', 'identification', 'policy_inquiry', 'billing', 'payment', 'escalation', 'completed'],
    default: 'greeting'
  },
  customerData: {
    policyNumber: String,
    cpfCnpj: String,
    customerName: String,
    email: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  conversationHistory: [conversationSchema],
  context: {
    lastPolicyCheck: Date,
    lastBillingInquiry: Date,
    pendingActions: [String],
    escalationReason: String,
    paymentIntentId: String
  },
  analytics: {
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    totalMessages: {
      type: Number,
      default: 0
    },
    billyResponses: {
      type: Number,
      default: 0
    },
    escalationAttempts: {
      type: Number,
      default: 0
    },
    completionReason: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    index: { expireAfterSeconds: 0 }
  }
});

// Middleware to update updatedAt on save
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
sessionSchema.methods.addMessage = function(fromUser, message, messageType = 'text', metadata = {}) {
  this.conversationHistory.push({
    fromUser,
    message,
    messageType,
    metadata
  });
  
  this.analytics.totalMessages++;
  if (!fromUser) {
    this.analytics.billyResponses++;
  }
  
  // Keep only last N messages to prevent document size issues
  const maxHistory = 50;
  if (this.conversationHistory.length > maxHistory) {
    this.conversationHistory = this.conversationHistory.slice(-maxHistory);
  }
  
  return this.save();
};

sessionSchema.methods.updateFlow = function(newFlow) {
  this.currentFlow = newFlow;
  return this.save();
};

sessionSchema.methods.setCustomerData = function(data) {
  this.customerData = { ...this.customerData, ...data };
  return this.save();
};

sessionSchema.methods.markCompleted = function(reason = 'user_request') {
  this.status = 'completed';
  this.analytics.endTime = new Date();
  this.analytics.completionReason = reason;
  return this.save();
};

sessionSchema.methods.escalate = function(reason) {
  this.status = 'escalated';
  this.context.escalationReason = reason;
  this.analytics.escalationAttempts++;
  return this.save();
};

// Static methods
sessionSchema.statics.findActiveSession = function(userId) {
  return this.findOne({ 
    userId, 
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

sessionSchema.statics.createNewSession = function(userId, userPhone, userName = 'Cliente') {
  const sessionId = require('uuid').v4();
  return this.create({
    sessionId,
    userId,
    userPhone,
    userName
  });
};

// Indexes for performance
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ 'customerData.policyNumber': 1 });

module.exports = mongoose.model('Session', sessionSchema);
