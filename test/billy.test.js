const billyHandler = require('../src/billy/billyHandler');
const billyPersona = require('../src/billy/persona');
const conversationFlow = require('../src/billy/conversationFlow');

describe('Billy, Agente X Tests', () => {
  
  describe('Billy Persona', () => {
    test('should have correct persona configuration', () => {
      expect(billyPersona.name).toBe('Billy, Agente X');
      expect(billyPersona.tone).toBe('professional, cordial e assertivo');
      expect(billyPersona.getGreetingMessage()).toContain('Billy');
    });

    test('should generate system prompt', () => {
      const prompt = billyPersona.getSystemPrompt();
      expect(prompt).toContain('Billy, Agente X');
      expect(prompt).toContain('cobrança de apólices');
      expect(prompt).toContain('profissional, cordial e assertivo');
    });

    test('should provide flow-specific prompts', () => {
      const greetingPrompt = billyPersona.getFlowSpecificPrompt('greeting');
      expect(greetingPrompt).toContain('SAUDAÇÃO');
      
      const identificationPrompt = billyPersona.getFlowSpecificPrompt('identification');
      expect(identificationPrompt).toContain('IDENTIFICAÇÃO');
    });
  });

  describe('Conversation Flow', () => {
    test('should detect escalation requests', () => {
      expect(conversationFlow.isEscalationRequest('quero falar com humano')).toBe(true);
      expect(conversationFlow.isEscalationRequest('atendente')).toBe(true);
      expect(conversationFlow.isEscalationRequest('olá')).toBe(false);
    });

    test('should detect identification info', () => {
      expect(conversationFlow.containsIdentificationInfo('12345678901')).toBe(true);
      expect(conversationFlow.containsIdentificationInfo('123456789')).toBe(true);
      expect(conversationFlow.containsIdentificationInfo('olá')).toBe(false);
    });

    test('should extract identification data', () => {
      const data1 = conversationFlow.extractIdentificationData('Meu CPF é 12345678901');
      expect(data1.cpfCnpj).toBe('12345678901');

      const data2 = conversationFlow.extractIdentificationData('Apólice 123456789');
      expect(data2.policyNumber).toBe('123456789');
    });
  });

  describe('Billy Handler', () => {
    test('should be properly configured', () => {
      expect(typeof billyHandler.processMessage).toBe('function');
      expect(typeof billyHandler.handleTimeout).toBe('function');
      expect(typeof billyHandler.getSessionSummary).toBe('function');
    });

    test('should handle special commands', async () => {
      const mockSession = {
        sessionId: 'test-123',
        currentFlow: 'greeting',
        conversationHistory: [],
        analytics: { totalMessages: 0 }
      };

      const helpResponse = await billyHandler.handleSpecialCommands('/help', mockSession);
      expect(helpResponse).toBeTruthy();
      expect(helpResponse.response).toContain('Billy, Agente X');

      const statusResponse = await billyHandler.handleSpecialCommands('/status', mockSession);
      expect(statusResponse).toBeTruthy();
      expect(statusResponse.response).toContain('Status da Sessão');
    });
  });

  describe('Error Handling', () => {
    test('should provide appropriate error messages', () => {
      const policyNotFound = billyPersona.getErrorMessage('policy_not_found');
      expect(policyNotFound).toContain('localizar uma apólice');

      const systemError = billyPersona.getErrorMessage('system_error');
      expect(systemError).toContain('dificuldade técnica');

      const unknownError = billyPersona.getErrorMessage('unknown_error');
      expect(unknownError).toContain('entendi');
    });
  });

  describe('Payment Options', () => {
    test('should provide payment options', () => {
      const options = billyPersona.getPaymentOptions();
      expect(options).toContain('boleto');
      expect(options).toContain('PIX');
      expect(options).toContain('parcelamento');
    });
  });

  describe('Escalation', () => {
    test('should provide escalation message', () => {
      const escalationMsg = billyPersona.getEscalationMessage('teste');
      expect(escalationMsg).toContain('transferir');
      expect(escalationMsg).toContain('atendente');
      expect(escalationMsg).toContain('teste');
    });
  });
});

// Integration tests (require database)
describe('Billy Integration Tests', () => {
  // These tests would require a test database
  // and should be run separately from unit tests
  
  test.skip('should create and manage sessions', async () => {
    // Test session creation and management
  });

  test.skip('should process full conversation flow', async () => {
    // Test complete conversation from greeting to completion
  });

  test.skip('should handle database errors gracefully', async () => {
    // Test error handling when database is unavailable
  });
});
