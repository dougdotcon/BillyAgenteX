const Session = require('../models/Session');
const Customer = require('../models/Customer');
const config = require('../../config');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor() {
    this.activeSessions = new Map(); // In-memory cache for active sessions
  }

  /**
   * Get or create a session for a user
   */
  async getOrCreateSession(userId, userPhone, userName = 'Cliente') {
    try {
      // First check in-memory cache
      if (this.activeSessions.has(userId)) {
        const cachedSession = this.activeSessions.get(userId);
        if (cachedSession.expiresAt > new Date()) {
          return cachedSession;
        } else {
          this.activeSessions.delete(userId);
        }
      }

      // Check database for active session
      let session = await Session.findActiveSession(userId);
      
      if (!session) {
        // Create new session
        session = await Session.createNewSession(userId, userPhone, userName);
        console.log(`[SessionService] New session created for user ${userId}: ${session.sessionId}`);
      } else {
        console.log(`[SessionService] Existing session found for user ${userId}: ${session.sessionId}`);
      }

      // Cache the session
      this.activeSessions.set(userId, session);
      
      return session;
    } catch (error) {
      console.error('[SessionService] Error getting/creating session:', error);
      throw error;
    }
  }

  /**
   * Add a message to the session
   */
  async addMessage(sessionId, fromUser, message, messageType = 'text', metadata = {}) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      await session.addMessage(fromUser, message, messageType, metadata);
      
      // Update cache
      this.activeSessions.set(session.userId, session);
      
      console.log(`[SessionService] Message added to session ${sessionId}: ${fromUser ? 'User' : 'Billy'}`);
      return session;
    } catch (error) {
      console.error('[SessionService] Error adding message:', error);
      throw error;
    }
  }

  /**
   * Update session flow
   */
  async updateFlow(sessionId, newFlow) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      await session.updateFlow(newFlow);
      
      // Update cache
      this.activeSessions.set(session.userId, session);
      
      console.log(`[SessionService] Flow updated for session ${sessionId}: ${newFlow}`);
      return session;
    } catch (error) {
      console.error('[SessionService] Error updating flow:', error);
      throw error;
    }
  }

  /**
   * Set customer data in session
   */
  async setCustomerData(sessionId, customerData) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      await session.setCustomerData(customerData);
      
      // Update cache
      this.activeSessions.set(session.userId, session);
      
      console.log(`[SessionService] Customer data updated for session ${sessionId}`);
      return session;
    } catch (error) {
      console.error('[SessionService] Error setting customer data:', error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId, reason = 'user_request') {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      await session.markCompleted(reason);
      
      // Remove from cache
      this.activeSessions.delete(session.userId);
      
      console.log(`[SessionService] Session completed ${sessionId}: ${reason}`);
      return session;
    } catch (error) {
      console.error('[SessionService] Error completing session:', error);
      throw error;
    }
  }

  /**
   * Escalate a session to human agent
   */
  async escalateSession(sessionId, reason) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      await session.escalate(reason);
      
      // Update cache
      this.activeSessions.set(session.userId, session);
      
      console.log(`[SessionService] Session escalated ${sessionId}: ${reason}`);
      return session;
    } catch (error) {
      console.error('[SessionService] Error escalating session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    try {
      return await Session.findOne({ sessionId });
    } catch (error) {
      console.error('[SessionService] Error getting session:', error);
      throw error;
    }
  }

  /**
   * Get session by user ID
   */
  async getSessionByUserId(userId) {
    try {
      // Check cache first
      if (this.activeSessions.has(userId)) {
        return this.activeSessions.get(userId);
      }

      // Check database
      const session = await Session.findActiveSession(userId);
      if (session) {
        this.activeSessions.set(userId, session);
      }
      
      return session;
    } catch (error) {
      console.error('[SessionService] Error getting session by user ID:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 20) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        return [];
      }

      return session.conversationHistory
        .slice(-limit)
        .map(msg => ({
          timestamp: msg.timestamp,
          fromUser: msg.fromUser,
          message: msg.message,
          messageType: msg.messageType
        }));
    } catch (error) {
      console.error('[SessionService] Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions from cache
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [userId, session] of this.activeSessions.entries()) {
      if (session.expiresAt <= now) {
        this.activeSessions.delete(userId);
        console.log(`[SessionService] Cleaned up expired session for user ${userId}`);
      }
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId) {
    try {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        return null;
      }

      return {
        sessionId: session.sessionId,
        userId: session.userId,
        status: session.status,
        currentFlow: session.currentFlow,
        duration: session.analytics.endTime 
          ? session.analytics.endTime - session.analytics.startTime 
          : Date.now() - session.analytics.startTime,
        totalMessages: session.analytics.totalMessages,
        billyResponses: session.analytics.billyResponses,
        escalationAttempts: session.analytics.escalationAttempts,
        completionReason: session.analytics.completionReason
      };
    } catch (error) {
      console.error('[SessionService] Error getting session analytics:', error);
      throw error;
    }
  }

  /**
   * Initialize cleanup interval
   */
  startCleanupInterval() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
    
    console.log('[SessionService] Cleanup interval started');
  }
}

module.exports = new SessionService();
