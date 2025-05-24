# 🤖 Billy, Agente X

***Assistente Virtual WhatsApp para Atendimento ao Cliente e Cobrança de Apólices***

Billy é um agente virtual inteligente especializado em atendimento ao cliente de seguradoras, com foco em cobrança de apólices e suporte ao cliente. Baseado no GPT-4o-mini com memória persistente e fluxo de conversa estruturado.

## ✨ Características Principais

- 🎯 **Atendimento Especializado**: Foco em cobrança de apólices e atendimento ao cliente
- 🧠 **Memória Persistente**: Mantém contexto da conversa até sua conclusão
- 🔄 **Fluxo Estruturado**: Processo guiado de identificação → consulta → cobrança → pagamento
- 🤖 **IA Avançada**: Integração com GPT-4o-mini para respostas naturais e contextuais
- 📊 **Analytics**: Monitoramento completo de sessões e performance
- 🔧 **Escalação Inteligente**: Transferência automática para atendimento humano quando necessário

## 🎭 Persona do Billy

**Nome:** Billy, Agente X
**Tom:** Profissional, cordial e assertivo
**Especialidade:** Cobrança de apólices e atendimento ao cliente
**Linguagem:** Português brasileiro, clara e acessível

## 🔄 Fluxo de Atendimento

1. **Saudação**: "Olá, sou Billy, seu agente de atendimento X. Em que posso ajudar hoje?"
2. **Identificação**: Solicita número da apólice ou CPF/CNPJ
3. **Verificação**: Confirma dados do cliente no sistema
4. **Consulta**: Apresenta status de faturas (vencidas, a vencer, pagas)
5. **Ação**: Oferece opções (gerar boleto, parcelar, lembrete)
6. **Confirmação**: Confirma ação realizada
7. **Encerramento**: Pergunta se há mais algo e se despede

## 🛠️ Stack Tecnológica

- **Node.js v20+** - Runtime JavaScript
- **Baileys** - Cliente WhatsApp Web
- **OpenAI GPT-4o-mini** - Inteligência artificial
- **MongoDB** - Banco de dados para sessões e clientes
- **Redis** - Cache de sessões ativas
- **Docker** - Containerização
- **Bull** - Filas de processamento

## 📋 Requisitos

- [Node.js](https://nodejs.org/en/download/) v20 ou superior
- [MongoDB](https://www.mongodb.com/) (local ou cloud)
- [Redis](https://redis.io/) (opcional, para cache)
- [Git](https://git-scm.com/downloads)
- Chave da API OpenAI

## 🚀 Instalação Rápida

### Método 1: Docker (Recomendado)

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/billy-agente-x.git
   cd billy-agente-x
   ```

2. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. **Execute com Docker**
   ```bash
   docker-compose up -d
   ```

### Método 2: Instalação Manual

1. **Clone e instale dependências**
   ```bash
   git clone https://github.com/seu-usuario/billy-agente-x.git
   cd billy-agente-x
   npm install
   ```

2. **Configure o ambiente**
   ```bash
   cp .env.example .env
   # Configure MongoDB, Redis e OpenAI API key
   ```

3. **Execute o bot**
   ```bash
   npm start
   ```

## ⚙️ Configuração

### Variáveis de Ambiente Essenciais

```env
# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui
OPENAI_MODEL=gpt-4o-mini

# Database
MONGODB_URI=mongodb://localhost:27017/billy-agente-x
REDIS_URL=redis://localhost:6379

# Billy
BILLY_NAME=Billy, Agente X
BILLY_COMPANY=Sua Seguradora
```

### Configuração da API OpenAI

1. Acesse [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Crie uma nova chave API
3. Adicione a chave no arquivo `.env` ou `key.json` (compatibilidade)

## 📱 Como Usar

### Comandos Básicos

- **Conversa Natural**: Digite qualquer mensagem para iniciar
- `/menu` - Exibe menu de opções
- `/billy` - Inicia conversa com Billy
- `/status` - Mostra status do sistema
- `/help` - Ajuda e comandos

### Comandos Legados (Compatibilidade)

- `/ai <pergunta>` - ChatGPT tradicional
- `/img <descrição>` - Gerar imagens com DALL-E

### Fluxo de Atendimento Típico

```
Usuário: Olá
Billy: Olá, sou Billy, seu agente de atendimento X. Em que posso ajudar hoje?

Usuário: 12345678901
Billy: Perfeito! Localizei sua conta: João Silva
       Apólices ativas: 2
       Vou verificar o status das suas faturas...

Billy: ⚠️ FATURA EM ATRASO
       Valor: R$ 450,00
       Vencimento: 15/01/2024

       Posso ajudá-lo com:
       💳 Gerar novo boleto
       📱 Link para pagamento via PIX
       💰 Parcelamento da fatura

Usuário: boleto
Billy: ✅ Boleto gerado com sucesso!
       Link: https://pagamento.exemplo.com/boleto/123456
```

## 🏗️ Arquitetura

```
├── config/                 # Configurações
├── src/
│   ├── billy/              # Core do Billy
│   │   ├── persona.js      # Personalidade e prompts
│   │   ├── conversationFlow.js  # Fluxo de conversa
│   │   └── billyHandler.js # Handler principal
│   ├── models/             # Modelos do banco
│   │   ├── Session.js      # Sessões de conversa
│   │   └── Customer.js     # Dados de clientes
│   └── services/           # Serviços
│       ├── sessionService.js    # Gerenciamento de sessões
│       └── database.js     # Conexão com banco
├── lib/                    # Bibliotecas auxiliares
└── docker-compose.yml      # Orquestração Docker
```

## 📊 Monitoramento e Analytics

Billy coleta métricas detalhadas:

- **Sessões**: Total, ativas, completadas, escaladas
- **Performance**: Tempo de resposta, taxa de resolução
- **Fluxo**: Etapas mais comuns, pontos de abandono
- **Satisfação**: Feedback dos clientes

Acesse as interfaces de admin:
- MongoDB: http://localhost:8081 (admin/admin123)
- Redis: http://localhost:8082

## 🔧 Desenvolvimento

### Executar em modo desenvolvimento
```bash
npm run dev
```

### Executar testes
```bash
npm test
```

### Build Docker
```bash
npm run docker:build
npm run docker:run
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Cliente WhatsApp Web
- [OpenAI](https://openai.com/) - Modelos de IA
- Projeto original [Wa-OpenAI](https://github.com/Sansekai/Wa-OpenAI) por Yusril

## 💝 Apoie o Projeto

<a href="https://saweria.co/sansekai" target="_blank">
  <img src="https://user-images.githubusercontent.com/26188697/180601310-e82c63e4-412b-4c36-b7b5-7ba713c80380.png" alt="Donate" height="41" width="174">
</a>

---

**Billy, Agente X v3.0.0** - Transformando atendimento ao cliente com IA 🤖✨
