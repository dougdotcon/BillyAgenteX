const sessionService = require('../services/sessionService');
const Customer = require('../models/Customer');
const billyPersona = require('./persona');

class ConversationFlow {
  constructor() {
    this.flows = {
      greeting: this.handleGreeting.bind(this),
      identification: this.handleIdentification.bind(this),
      policy_inquiry: this.handlePolicyInquiry.bind(this),
      billing: this.handleBilling.bind(this),
      payment: this.handlePayment.bind(this),
      escalation: this.handleEscalation.bind(this),
      completed: this.handleCompleted.bind(this)
    };
  }

  /**
   * Process user message and determine next flow step
   */
  async processMessage(session, userMessage) {
    try {
      const currentFlow = session.currentFlow;
      const flowHandler = this.flows[currentFlow];
      
      if (!flowHandler) {
        console.error(`[ConversationFlow] Unknown flow: ${currentFlow}`);
        return await this.handleUnknownFlow(session, userMessage);
      }

      console.log(`[ConversationFlow] Processing message in flow: ${currentFlow}`);
      return await flowHandler(session, userMessage);
    } catch (error) {
      console.error('[ConversationFlow] Error processing message:', error);
      return {
        response: billyPersona.getErrorMessage('system_error'),
        nextFlow: 'escalation',
        shouldEscalate: true
      };
    }
  }

  /**
   * Handle greeting flow
   */
  async handleGreeting(session, userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for immediate escalation requests
    if (this.isEscalationRequest(lowerMessage)) {
      return {
        response: billyPersona.getEscalationMessage('solicitação do cliente'),
        nextFlow: 'escalation',
        shouldEscalate: true
      };
    }

    // Check if user already provided identification info
    if (this.containsIdentificationInfo(userMessage)) {
      return {
        response: `${billyPersona.getGreetingMessage()}\n\nVi que você já informou alguns dados. Vou verificar suas informações...`,
        nextFlow: 'identification',
        extractedData: this.extractIdentificationData(userMessage)
      };
    }

    // Standard greeting response
    return {
      response: `${billyPersona.getGreetingMessage()}\n\nPara que eu possa ajudá-lo, preciso de algumas informações:\n\n📋 *Número da apólice* OU\n🆔 *CPF/CNPJ*\n\nPoderia me informar um desses dados?`,
      nextFlow: 'identification'
    };
  }

  /**
   * Handle identification flow
   */
  async handleIdentification(session, userMessage) {
    const extractedData = this.extractIdentificationData(userMessage);
    
    if (!extractedData.policyNumber && !extractedData.cpfCnpj) {
      return {
        response: 'Não consegui identificar um número de apólice ou CPF/CNPJ válido na sua mensagem.\n\nPoderia informar:\n📋 *Número da apólice* (ex: 123456789)\nOU\n🆔 *CPF/CNPJ* (apenas números)',
        nextFlow: 'identification'
      };
    }

    // Try to find customer
    let customer = null;
    if (extractedData.cpfCnpj) {
      customer = await Customer.findByCpfCnpj(extractedData.cpfCnpj);
    } else if (extractedData.policyNumber) {
      customer = await Customer.findByPolicyNumber(extractedData.policyNumber);
    }

    if (!customer) {
      return {
        response: billyPersona.getErrorMessage('policy_not_found'),
        nextFlow: 'identification'
      };
    }

    // Update session with customer data
    await sessionService.setCustomerData(session.sessionId, {
      policyNumber: extractedData.policyNumber,
      cpfCnpj: extractedData.cpfCnpj,
      customerName: customer.personalInfo.name,
      verified: true
    });

    return {
      response: `Perfeito! Localizei sua conta:\n\n👤 *${customer.personalInfo.name}*\n📋 *Apólices ativas:* ${customer.policies.length}\n\nVou verificar o status das suas faturas...`,
      nextFlow: 'policy_inquiry',
      customerData: customer
    };
  }

  /**
   * Handle policy inquiry flow
   */
  async handlePolicyInquiry(session, userMessage) {
    // This would typically fetch real policy data from an API
    // For now, we'll simulate the response
    
    const mockPolicyData = {
      hasOverdue: true,
      overdueAmount: 450.00,
      dueDate: '2024-01-15',
      nextDueDate: '2024-02-15',
      nextAmount: 380.00
    };

    if (mockPolicyData.hasOverdue) {
      return {
        response: `📊 *Status das suas apólices:*\n\n⚠️ *FATURA EM ATRASO*\n💰 Valor: R$ ${mockPolicyData.overdueAmount.toFixed(2)}\n📅 Vencimento: ${mockPolicyData.dueDate}\n\n📋 *Próxima fatura:*\n💰 Valor: R$ ${mockPolicyData.nextAmount.toFixed(2)}\n📅 Vencimento: ${mockPolicyData.nextDueDate}\n\n${billyPersona.getPaymentOptions()}`,
        nextFlow: 'billing',
        policyData: mockPolicyData
      };
    } else {
      return {
        response: `✅ *Suas apólices estão em dia!*\n\n📋 *Próxima fatura:*\n💰 Valor: R$ ${mockPolicyData.nextAmount.toFixed(2)}\n📅 Vencimento: ${mockPolicyData.nextDueDate}\n\nPosso ajudá-lo com mais alguma coisa?`,
        nextFlow: 'completed'
      };
    }
  }

  /**
   * Handle billing flow
   */
  async handleBilling(session, userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('boleto') || lowerMessage.includes('gerar')) {
      return {
        response: '📄 *Gerando seu boleto...*\n\nEm instantes você receberá o link para pagamento.\n\n✅ Boleto gerado com sucesso!\n🔗 Link: https://pagamento.exemplo.com/boleto/123456\n\nO boleto também foi enviado por email.\n\nPosso ajudá-lo com mais alguma coisa?',
        nextFlow: 'payment',
        action: 'generate_boleto'
      };
    }
    
    if (lowerMessage.includes('pix')) {
      return {
        response: '📱 *Gerando link PIX...*\n\n✅ Link PIX gerado!\n🔗 https://pagamento.exemplo.com/pix/123456\n\n📋 *Chave PIX:* 12345678901234567890\n💰 *Valor:* R$ 450,00\n\nO pagamento via PIX é processado instantaneamente.\n\nPosso ajudá-lo com mais alguma coisa?',
        nextFlow: 'payment',
        action: 'generate_pix'
      };
    }
    
    if (lowerMessage.includes('parcel') || lowerMessage.includes('dividir')) {
      return {
        response: '💳 *Opções de parcelamento:*\n\n2x de R$ 225,00 (sem juros)\n3x de R$ 155,00 (juros 2%)\n4x de R$ 120,00 (juros 3%)\n\nQual opção você prefere?',
        nextFlow: 'payment',
        action: 'installment_options'
      };
    }
    
    if (lowerMessage.includes('humano') || lowerMessage.includes('atendente')) {
      return {
        response: billyPersona.getEscalationMessage('solicitação de atendimento humano'),
        nextFlow: 'escalation',
        shouldEscalate: true
      };
    }

    return {
      response: 'Não entendi sua escolha. Poderia selecionar uma das opções:\n\n' + billyPersona.getPaymentOptions(),
      nextFlow: 'billing'
    };
  }

  /**
   * Handle payment flow
   */
  async handlePayment(session, userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('2x') || lowerMessage.includes('duas')) {
      return {
        response: '✅ *Parcelamento confirmado!*\n\n💳 2x de R$ 225,00 (sem juros)\n📅 Vencimentos: 15/01 e 15/02\n\n📄 Os boletos foram gerados:\n🔗 1ª parcela: https://pagamento.exemplo.com/boleto/123456-1\n🔗 2ª parcela: https://pagamento.exemplo.com/boleto/123456-2\n\nOs boletos também foram enviados por email.\n\nSua situação foi regularizada! Posso ajudá-lo com mais alguma coisa?',
        nextFlow: 'completed',
        action: 'installment_confirmed'
      };
    }

    return {
      response: '✅ *Pagamento processado com sucesso!*\n\nSua apólice está regularizada. Você receberá uma confirmação por email em breve.\n\nObrigado por manter sua apólice em dia! Posso ajudá-lo com mais alguma coisa?',
      nextFlow: 'completed'
    };
  }

  /**
   * Handle escalation flow
   */
  async handleEscalation(session, userMessage) {
    await sessionService.escalateSession(session.sessionId, 'Transferido para atendimento humano');
    
    return {
      response: '👥 *Transferindo para atendente humano...*\n\nUm de nossos especialistas entrará em contato em breve. Mantenha esta conversa aberta.\n\nTempo estimado de espera: 5-10 minutos.\n\nObrigado pela paciência!',
      nextFlow: 'escalation',
      shouldEscalate: true
    };
  }

  /**
   * Handle completed flow
   */
  async handleCompleted(session, userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('não') || lowerMessage.includes('nao') || lowerMessage.includes('obrigad')) {
      await sessionService.completeSession(session.sessionId, 'completed_successfully');
      return {
        response: billyPersona.getFarewellMessage(),
        nextFlow: 'completed',
        shouldComplete: true
      };
    }
    
    // If user has more questions, restart the flow
    return {
      response: 'Claro! Como posso ajudá-lo?\n\nPrecisa de:\n📋 Consultar outra apólice\n💰 Gerar novo boleto\n📞 Falar com atendente\n\nOu me diga como posso ajudar.',
      nextFlow: 'greeting'
    };
  }

  /**
   * Handle unknown flow
   */
  async handleUnknownFlow(session, userMessage) {
    return {
      response: billyPersona.getErrorMessage('system_error'),
      nextFlow: 'escalation',
      shouldEscalate: true
    };
  }

  /**
   * Check if message is an escalation request
   */
  isEscalationRequest(message) {
    const escalationKeywords = ['humano', 'atendente', 'pessoa', 'operador', 'supervisor'];
    return escalationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message contains identification info
   */
  containsIdentificationInfo(message) {
    // Check for CPF/CNPJ pattern (11 or 14 digits)
    const cpfCnpjPattern = /\b\d{11}|\d{14}\b/;
    // Check for policy number pattern (assuming 6-12 digits)
    const policyPattern = /\b\d{6,12}\b/;
    
    return cpfCnpjPattern.test(message) || policyPattern.test(message);
  }

  /**
   * Extract identification data from message
   */
  extractIdentificationData(message) {
    const data = {};
    
    // Extract CPF/CNPJ (11 or 14 digits)
    const cpfCnpjMatch = message.match(/\b(\d{11}|\d{14})\b/);
    if (cpfCnpjMatch) {
      data.cpfCnpj = cpfCnpjMatch[1];
    }
    
    // Extract policy number (6-12 digits, but not CPF/CNPJ)
    const policyMatch = message.match(/\b(\d{6,12})\b/);
    if (policyMatch && policyMatch[1] !== data.cpfCnpj) {
      data.policyNumber = policyMatch[1];
    }
    
    return data;
  }
}

module.exports = new ConversationFlow();
