const OpenAI = require('openai');
const config = require('../../config');
const sessionService = require('../services/sessionService');
const conversationFlow = require('./conversationFlow');
const billyPersona = require('./persona');
const Customer = require('../models/Customer');

class BillyHandler {
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: config.openai.apiKey 
    });
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (config.openai.apiKey === 'ISI_APIKEY_OPENAI_DISINI') {
      console.warn('[BillyHandler] OpenAI API key not configured. Billy will use rule-based responses only.');
      this.isInitialized = false;
    } else {
      this.isInitialized = true;
      console.log('[BillyHandler] Initialized with OpenAI integration');
    }
  }

  /**
   * Process incoming message and generate Billy's response
   */
  async processMessage(userId, userPhone, userName, userMessage, messageType = 'text') {
    try {
      console.log(`[BillyHandler] Processing message from ${userId}: ${userMessage}`);

      // Get or create session
      const session = await sessionService.getOrCreateSession(userId, userPhone, userName);
      
      // Add user message to session
      await sessionService.addMessage(session.sessionId, true, userMessage, messageType);

      // Check for special commands first
      const specialResponse = await this.handleSpecialCommands(userMessage, session);
      if (specialResponse) {
        await sessionService.addMessage(session.sessionId, false, specialResponse.response);
        return specialResponse;
      }

      // Process through conversation flow
      const flowResult = await conversationFlow.processMessage(session, userMessage);
      
      // Generate AI-enhanced response if OpenAI is available
      let finalResponse = flowResult.response;
      if (this.isInitialized && !flowResult.shouldEscalate) {
        try {
          const aiResponse = await this.generateAIResponse(session, userMessage, flowResult);
          if (aiResponse) {
            finalResponse = aiResponse;
          }
        } catch (aiError) {
          console.error('[BillyHandler] AI response generation failed, using flow response:', aiError);
          // Continue with flow response as fallback
        }
      }

      // Update session flow if needed
      if (flowResult.nextFlow && flowResult.nextFlow !== session.currentFlow) {
        await sessionService.updateFlow(session.sessionId, flowResult.nextFlow);
      }

      // Handle escalation
      if (flowResult.shouldEscalate) {
        await sessionService.escalateSession(session.sessionId, flowResult.escalationReason || 'User request');
      }

      // Handle completion
      if (flowResult.shouldComplete) {
        await sessionService.completeSession(session.sessionId, 'completed_successfully');
      }

      // Add Billy's response to session
      await sessionService.addMessage(session.sessionId, false, finalResponse);

      console.log(`[BillyHandler] Response generated for ${userId} in flow ${flowResult.nextFlow || session.currentFlow}`);

      return {
        response: finalResponse,
        sessionId: session.sessionId,
        currentFlow: flowResult.nextFlow || session.currentFlow,
        shouldEscalate: flowResult.shouldEscalate,
        shouldComplete: flowResult.shouldComplete,
        metadata: flowResult
      };

    } catch (error) {
      console.error('[BillyHandler] Error processing message:', error);
      
      // Return error response
      const errorResponse = billyPersona.getErrorMessage('system_error');
      return {
        response: errorResponse,
        error: true,
        shouldEscalate: true
      };
    }
  }

  /**
   * Generate AI-enhanced response using OpenAI
   */
  async generateAIResponse(session, userMessage, flowResult) {
    try {
      // Get customer data if available
      let customerData = null;
      if (session.customerData && session.customerData.cpfCnpj) {
        customerData = await Customer.findByCpfCnpj(session.customerData.cpfCnpj);
      }

      // Build context prompt
      const systemPrompt = billyPersona.getContextualPrompt(session, customerData);
      const flowPrompt = billyPersona.getFlowSpecificPrompt(session.currentFlow);

      // Prepare conversation history for context
      const recentHistory = session.conversationHistory.slice(-6).map(msg => ({
        role: msg.fromUser ? 'user' : 'assistant',
        content: msg.message
      }));

      // Build messages array
      const messages = [
        {
          role: 'system',
          content: `${systemPrompt}\n\n${flowPrompt}\n\nRESPOSTA SUGERIDA PELO SISTEMA: ${flowResult.response}\n\nUse esta resposta como base, mas melhore-a para ser mais natural e personalizada. Mantenha o mesmo conteúdo informativo, mas ajuste o tom e a linguagem.`
        },
        ...recentHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (aiResponse && aiResponse.trim()) {
        console.log('[BillyHandler] AI response generated successfully');
        return aiResponse.trim();
      }

      return null;
    } catch (error) {
      console.error('[BillyHandler] Error generating AI response:', error);
      return null;
    }
  }

  /**
   * Handle special commands
   */
  async handleSpecialCommands(message, session) {
    const lowerMessage = message.toLowerCase().trim();

    // Help command
    if (lowerMessage === '/help' || lowerMessage === '/menu' || lowerMessage === 'help') {
      return {
        response: `🤖 *Billy, Agente X - Menu de Ajuda*\n\n📋 *Comandos disponíveis:*\n/status - Ver status da sessão\n/restart - Reiniciar conversa\n/human - Falar com atendente\n\n💡 *Como posso ajudar:*\n• Consultar apólices\n• Gerar boletos\n• Parcelar faturas\n• Tirar dúvidas sobre pagamentos\n\nDigite sua dúvida ou informe seu CPF/CNPJ para começar!`,
        nextFlow: session.currentFlow
      };
    }

    // Status command
    if (lowerMessage === '/status') {
      const analytics = await sessionService.getSessionAnalytics(session.sessionId);
      return {
        response: `📊 *Status da Sessão*\n\n🆔 ID: ${session.sessionId.substring(0, 8)}...\n📍 Etapa: ${session.currentFlow}\n💬 Mensagens: ${analytics.totalMessages}\n⏱️ Duração: ${Math.round(analytics.duration / 1000 / 60)} min\n\nComo posso continuar ajudando?`,
        nextFlow: session.currentFlow
      };
    }

    // Restart command
    if (lowerMessage === '/restart' || lowerMessage === 'restart') {
      await sessionService.completeSession(session.sessionId, 'user_restart');
      return {
        response: `🔄 *Conversa reiniciada!*\n\n${billyPersona.getGreetingMessage()}\n\nPara que eu possa ajudá-lo, preciso de algumas informações:\n\n📋 *Número da apólice* OU\n🆔 *CPF/CNPJ*\n\nPoderia me informar um desses dados?`,
        nextFlow: 'identification',
        shouldRestart: true
      };
    }

    // Human/escalation command
    if (lowerMessage === '/human' || lowerMessage === 'human' || lowerMessage === 'atendente') {
      return {
        response: billyPersona.getEscalationMessage('comando direto do usuário'),
        nextFlow: 'escalation',
        shouldEscalate: true,
        escalationReason: 'User requested human agent via command'
      };
    }

    return null;
  }

  /**
   * Handle timeout scenarios
   */
  async handleTimeout(sessionId) {
    try {
      const session = await sessionService.getSession(sessionId);
      if (!session) return null;

      const timeoutMessage = billyPersona.getErrorMessage('timeout');
      await sessionService.addMessage(sessionId, false, timeoutMessage);

      return {
        response: timeoutMessage,
        sessionId: sessionId,
        isTimeout: true
      };
    } catch (error) {
      console.error('[BillyHandler] Error handling timeout:', error);
      return null;
    }
  }

  /**
   * Get session summary for handoff to human agent
   */
  async getSessionSummary(sessionId) {
    try {
      const session = await sessionService.getSession(sessionId);
      if (!session) return null;

      const analytics = await sessionService.getSessionAnalytics(sessionId);
      const history = await sessionService.getConversationHistory(sessionId, 10);

      return {
        sessionId: session.sessionId,
        userId: session.userId,
        userName: session.userName,
        customerData: session.customerData,
        currentFlow: session.currentFlow,
        analytics: analytics,
        recentHistory: history,
        escalationReason: session.context.escalationReason
      };
    } catch (error) {
      console.error('[BillyHandler] Error getting session summary:', error);
      return null;
    }
  }

  /**
   * Check if Billy is properly configured
   */
  isConfigured() {
    return this.isInitialized;
  }
}

module.exports = new BillyHandler();
