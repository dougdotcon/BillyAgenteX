# 🚀 Billy, Agente X - Quick Start Guide

Este guia te ajudará a colocar Billy funcionando em poucos minutos!

## ⚡ Instalação Rápida (5 minutos)

### Pré-requisitos
- Node.js v20+ instalado
- Chave da API OpenAI
- WhatsApp no celular

### Passo 1: Clone e Configure
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/billy-agente-x.git
cd billy-agente-x

# Execute o assistente de configuração
npm run setup
```

### Passo 2: Instale Dependências
```bash
npm install
```

### Passo 3: Execute Billy
```bash
npm start
```

### Passo 4: Conecte WhatsApp
1. Um QR Code aparecerá no terminal
2. Abra WhatsApp no celular
3. Vá em **Dispositivos Conectados** > **Conectar Dispositivo**
4. Escaneie o QR Code

🎉 **Pronto! Billy está online!**

## 🧪 Teste Rápido

Envie uma mensagem para o número conectado:

```
Você: Olá
Billy: Olá, sou Billy, seu agente de atendimento X. Em que posso ajudar hoje?

Você: 12345678901
Billy: Perfeito! Localizei sua conta: João Silva
      Vou verificar o status das suas faturas...
```

## 🐳 Instalação com Docker (Recomendado para Produção)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/billy-agente-x.git
cd billy-agente-x

# Configure ambiente
cp .env.example .env
# Edite .env com suas configurações

# Execute com Docker
docker-compose up -d

# Veja os logs
docker-compose logs -f billy-bot
```

## 🔧 Configuração Mínima

Edite o arquivo `.env`:

```env
# Obrigatório
OPENAI_API_KEY=sua_chave_aqui

# Opcional (usa valores padrão)
BILLY_NAME=Billy, Agente X
BILLY_COMPANY=Sua Seguradora
MONGODB_URI=mongodb://localhost:27017/billy-agente-x
```

## 📱 Comandos Básicos

- **Conversa normal**: Digite qualquer mensagem
- `/menu` - Menu principal
- `/status` - Status do sistema
- `/help` - Ajuda

## 🔍 Solução de Problemas

### Billy não responde?
1. Verifique se a chave OpenAI está configurada
2. Veja os logs no terminal
3. Teste com `/status`

### Erro de conexão WhatsApp?
1. Delete a pasta `billy-session/`
2. Reinicie o bot
3. Escaneie o QR Code novamente

### Erro de banco de dados?
Billy funciona sem banco, mas com funcionalidades limitadas.
Para funcionalidade completa, instale MongoDB.

## 📊 Monitoramento

### Logs em tempo real
```bash
# Logs do bot
tail -f logs/billy.log

# Logs do Docker
docker-compose logs -f
```

### Interfaces Web
- MongoDB Admin: http://localhost:8081
- Redis Admin: http://localhost:8082

## 🎯 Próximos Passos

1. **Personalize Billy**: Edite `src/billy/persona.js`
2. **Configure APIs**: Integre com seu sistema de apólices
3. **Customize Fluxos**: Modifique `src/billy/conversationFlow.js`
4. **Deploy**: Use Docker em produção

## 💡 Dicas

- **Desenvolvimento**: Use `npm run dev` para auto-reload
- **Testes**: Execute `npm test` para verificar funcionamento
- **Backup**: Faça backup da pasta `sessions/`
- **Logs**: Monitore logs para debugging

## 🆘 Precisa de Ajuda?

1. Verifique a [documentação completa](README.md)
2. Veja os [exemplos de uso](examples/)
3. Abra uma [issue no GitHub](https://github.com/seu-usuario/billy-agente-x/issues)

---

**Billy está pronto para transformar seu atendimento! 🤖✨**
