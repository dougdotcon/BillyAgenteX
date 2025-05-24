const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true
    },
    cpfCnpj: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: Date,
    address: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  whatsappInfo: {
    lastKnownNumber: String,
    preferredContactTime: {
      start: String, // HH:MM format
      end: String    // HH:MM format
    },
    communicationPreferences: {
      language: {
        type: String,
        default: 'pt-BR'
      },
      notifications: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    }
  },
  policies: [{
    policyNumber: {
      type: String,
      required: true
    },
    policyType: {
      type: String,
      enum: ['auto', 'home', 'life', 'health', 'business'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    premium: Number,
    coverage: mongoose.Schema.Types.Mixed,
    lastPayment: Date,
    nextDueDate: Date
  }],
  billingInfo: {
    preferredPaymentMethod: {
      type: String,
      enum: ['boleto', 'credit_card', 'debit', 'pix', 'bank_transfer'],
      default: 'boleto'
    },
    billingAddress: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String
    },
    paymentHistory: [{
      date: Date,
      amount: Number,
      method: String,
      status: String,
      transactionId: String
    }]
  },
  interactionHistory: {
    totalSessions: {
      type: Number,
      default: 0
    },
    lastContact: Date,
    lastSuccessfulPayment: Date,
    escalationCount: {
      type: Number,
      default: 0
    },
    satisfactionRatings: [{
      date: Date,
      rating: Number, // 1-5
      feedback: String,
      sessionId: String
    }],
    notes: [{
      date: {
        type: Date,
        default: Date.now
      },
      agent: String,
      note: String,
      type: {
        type: String,
        enum: ['general', 'billing', 'complaint', 'compliment', 'technical'],
        default: 'general'
      }
    }]
  },
  riskProfile: {
    paymentBehavior: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    latePayments: {
      type: Number,
      default: 0
    },
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual', 'direct', 'detailed'],
      default: 'casual'
    },
    preferredChannel: {
      type: String,
      enum: ['whatsapp', 'email', 'phone', 'sms'],
      default: 'whatsapp'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'vip'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update updatedAt on save
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
customerSchema.methods.addPolicy = function(policyData) {
  this.policies.push(policyData);
  return this.save();
};

customerSchema.methods.updatePolicy = function(policyNumber, updateData) {
  const policy = this.policies.find(p => p.policyNumber === policyNumber);
  if (policy) {
    Object.assign(policy, updateData);
    return this.save();
  }
  return Promise.reject(new Error('Policy not found'));
};

customerSchema.methods.addPayment = function(paymentData) {
  this.billingInfo.paymentHistory.push(paymentData);
  if (paymentData.status === 'completed') {
    this.interactionHistory.lastSuccessfulPayment = new Date();
  }
  return this.save();
};

customerSchema.methods.addNote = function(agent, note, type = 'general') {
  this.interactionHistory.notes.push({
    agent,
    note,
    type
  });
  return this.save();
};

customerSchema.methods.updateRiskProfile = function(updates) {
  this.riskProfile = { ...this.riskProfile, ...updates };
  return this.save();
};

customerSchema.methods.recordInteraction = function() {
  this.interactionHistory.totalSessions++;
  this.interactionHistory.lastContact = new Date();
  return this.save();
};

// Static methods
customerSchema.statics.findByCpfCnpj = function(cpfCnpj) {
  return this.findOne({ 'personalInfo.cpfCnpj': cpfCnpj });
};

customerSchema.statics.findByPolicyNumber = function(policyNumber) {
  return this.findOne({ 'policies.policyNumber': policyNumber });
};

customerSchema.statics.findByPhone = function(phone) {
  return this.findOne({ 
    $or: [
      { 'personalInfo.phone': phone },
      { 'whatsappInfo.lastKnownNumber': phone }
    ]
  });
};

// Indexes for performance
customerSchema.index({ 'personalInfo.cpfCnpj': 1 });
customerSchema.index({ 'personalInfo.phone': 1 });
customerSchema.index({ 'policies.policyNumber': 1 });
customerSchema.index({ 'whatsappInfo.lastKnownNumber': 1 });
customerSchema.index({ status: 1 });

module.exports = mongoose.model('Customer', customerSchema);
