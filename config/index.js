require('dotenv').config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'ISI_APIKEY_OPENAI_DISINI',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  },

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/billy-agente-x',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      }
    }
  },

  // WhatsApp Configuration
  whatsapp: {
    sessionName: process.env.WA_SESSION_NAME || 'billy-session',
    printQR: process.env.WA_PRINT_QR === 'true',
    markOnline: process.env.WA_MARK_ONLINE === 'true',
    browser: ['Billy Agente X', 'Chrome', '3.0.0'],
  },

  // Billy Configuration
  billy: {
    name: process.env.BILLY_NAME || 'Billy, Agente X',
    company: process.env.BILLY_COMPANY || 'Seguradora X',
    timezone: process.env.BILLY_TIMEZONE || 'America/Sao_Paulo',
    language: process.env.BILLY_LANGUAGE || 'pt-BR',
    persona: {
      tone: 'professional, cordial e assertivo',
      greeting: 'Olá, sou Billy, seu agente de atendimento X. Em que posso ajudar hoje?',
      farewell: 'Foi um prazer atendê-lo! Tenha um ótimo dia e conte sempre conosco.',
    }
  },

  // Session Configuration
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutes
    maxHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY) || 20,
    retentionDays: parseInt(process.env.MEMORY_RETENTION_DAYS) || 30,
  },

  // Business APIs
  apis: {
    policy: process.env.POLICY_API_URL || 'http://localhost:3001/api/policies',
    billing: process.env.BILLING_API_URL || 'http://localhost:3001/api/billing',
    payment: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:3001/api/payments',
  },

  // Monitoring & Analytics
  monitoring: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Queue Configuration
  queue: {
    redis: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379',
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'billy-default-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'billy-encryption-key',
  },

  // Command Prefixes
  commands: {
    prefixes: ['/', '!', '#', '.'],
    defaultPrefix: '/',
  }
};

module.exports = config;
