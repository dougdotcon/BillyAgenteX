const mongoose = require('mongoose');
const config = require('../../config');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      console.log('[Database] Connecting to MongoDB...');
      
      await mongoose.connect(config.database.mongodb.uri, {
        ...config.database.mongodb.options,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      this.connectionRetries = 0;
      
      console.log('[Database] Connected to MongoDB successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('[Database] MongoDB connection error:', error);
      
      this.connectionRetries++;
      if (this.connectionRetries < this.maxRetries) {
        console.log(`[Database] Retrying connection (${this.connectionRetries}/${this.maxRetries}) in 5 seconds...`);
        setTimeout(() => this.connect(), 5000);
      } else {
        console.error('[Database] Max connection retries reached. Running without database.');
        this.isConnected = false;
      }
      
      return false;
    }
  }

  /**
   * Set up MongoDB event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('[Database] MongoDB connected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('[Database] MongoDB error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[Database] MongoDB disconnected');
      this.isConnected = false;
      
      // Attempt to reconnect
      if (this.connectionRetries < this.maxRetries) {
        console.log('[Database] Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      }
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed');
      this.isConnected = false;
    } catch (error) {
      console.error('[Database] Error closing MongoDB connection:', error);
    }
  }

  /**
   * Check if database is connected
   */
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      state: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  /**
   * Initialize database with default data
   */
  async initializeData() {
    try {
      if (!this.isReady()) {
        console.log('[Database] Database not ready, skipping initialization');
        return false;
      }

      console.log('[Database] Initializing default data...');

      // Create sample customer data for testing
      const Customer = require('../models/Customer');
      
      const sampleCustomer = await Customer.findOne({ 'personalInfo.cpfCnpj': '12345678901' });
      if (!sampleCustomer) {
        await Customer.create({
          customerId: 'CUST001',
          personalInfo: {
            name: 'João Silva',
            cpfCnpj: '12345678901',
            email: 'joao.silva@email.com',
            phone: '5511999999999'
          },
          whatsappInfo: {
            lastKnownNumber: '5511999999999',
            communicationPreferences: {
              language: 'pt-BR',
              notifications: true
            }
          },
          policies: [{
            policyNumber: '123456789',
            policyType: 'auto',
            status: 'active',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2024-12-31'),
            premium: 450.00,
            nextDueDate: new Date('2024-01-15')
          }],
          billingInfo: {
            preferredPaymentMethod: 'boleto'
          },
          status: 'active'
        });

        console.log('[Database] Sample customer created');
      }

      console.log('[Database] Data initialization completed');
      return true;
    } catch (error) {
      console.error('[Database] Error initializing data:', error);
      return false;
    }
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      if (!this.isReady()) {
        return { status: 'error', message: 'Database not connected' };
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();
      
      return { 
        status: 'healthy', 
        message: 'Database connection is healthy',
        details: this.getStatus()
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Database health check failed',
        error: error.message 
      };
    }
  }

  /**
   * Clean up old sessions and data
   */
  async cleanup() {
    try {
      if (!this.isReady()) {
        console.log('[Database] Database not ready, skipping cleanup');
        return;
      }

      const Session = require('../models/Session');
      
      // Remove sessions older than retention period
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.session.retentionDays);
      
      const result = await Session.deleteMany({
        createdAt: { $lt: retentionDate },
        status: { $in: ['completed', 'timeout'] }
      });

      console.log(`[Database] Cleanup completed: ${result.deletedCount} old sessions removed`);
    } catch (error) {
      console.error('[Database] Error during cleanup:', error);
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanupSchedule() {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanup();
    }, 24 * 60 * 60 * 1000);

    console.log('[Database] Cleanup schedule started');
  }
}

module.exports = new DatabaseService();
