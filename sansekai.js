const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const OpenAI = require("openai");

// Billy, Agente X imports
const config = require("./config");
const billyHandler = require("./src/billy/billyHandler");
const databaseService = require("./src/services/database");

// Legacy support for key.json
let setting = require("./key.json");
const openai = new OpenAI({ apiKey: setting.keyopenai || config.openai.apiKey });

module.exports = sansekai = async (upsert, sock, store, message) => {
  try {
    let budy = (typeof message.text == 'string' ? message.text : '')
    // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
    var prefix = /^[\\/!#.]/gi.test(budy) ? budy.match(/^[\\/!#.]/gi) : "/";
    const isCmd = budy.startsWith(prefix);
    const command = budy.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
    const args = budy.trim().split(/ +/).slice(1);
    const pushname = message.pushName || "No Name";
    const botNumber = sock.user.id;
    const itsMe = message.sender == botNumber ? true : false;
    let text = (q = args.join(" "));
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);
    const from = message.chat;

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    // Group
    const groupMetadata = message.isGroup ? await sock.groupMetadata(message.chat).catch((e) => {}) : "";
    const groupName = message.isGroup ? groupMetadata.subject : "";

    // Push Message To Console
    let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;

    if (isCmd && !message.isGroup) {
      console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${message.sender.replace("@s.whatsapp.net", "")} ]`));
    } else if (isCmd && message.isGroup) {
      console.log(
        chalk.black(chalk.bgWhite("[ LOGS ]")),
        color(argsLog, "turquoise"),
        chalk.magenta("From"),
        chalk.green(pushname),
        chalk.yellow(`[ ${message.sender.replace("@s.whatsapp.net", "")} ]`),
        chalk.blueBright("IN"),
        chalk.green(groupName)
      );
    }

    // Billy, Agente X Integration - Handle non-command messages
    if (!isCmd) {
      try {
        console.log(`[Billy] Processing message from ${pushname} (${message.sender}): ${budy}`);

        const billyResponse = await billyHandler.processMessage(
          message.sender,
          message.sender.replace("@s.whatsapp.net", ""),
          pushname,
          budy
        );

        if (billyResponse && billyResponse.response) {
          await message.reply(billyResponse.response);

          // Log Billy's response
          console.log(`[Billy] Response sent to ${pushname}: ${billyResponse.currentFlow || 'unknown'} flow`);

          if (billyResponse.shouldEscalate) {
            console.log(`[Billy] Session escalated for ${pushname}: ${billyResponse.metadata?.escalationReason || 'unknown reason'}`);
          }
        }

        return; // Exit early for Billy handling
      } catch (billyError) {
        console.error('[Billy] Error processing message:', billyError);
        // Fall through to legacy handling
      }
    }

    if (isCmd) {
      switch (command) {
        case "help": case "menu": case "start": case "info":
          message.reply(`*🤖 Billy, Agente X - Menu Principal*

*🎯 Atendimento Inteligente:*
Envie uma mensagem normal para falar comigo!
Posso ajudar com consultas de apólices, pagamentos e muito mais.

*⚡ Comandos Rápidos:*
${prefix}billy - Iniciar conversa com Billy
${prefix}status - Ver status do sistema

*🔧 Comandos Legados:*
${prefix}ai - ChatGPT tradicional
${prefix}img - Gerar imagens (DALL-E)
${prefix}sc - Código fonte

*💡 Dica:* Digite qualquer mensagem para começar a conversar comigo!`)
          break;

        case "billy": case "iniciar": case "start":
          try {
            const billyResponse = await billyHandler.processMessage(
              message.sender,
              message.sender.replace("@s.whatsapp.net", ""),
              pushname,
              "Olá"
            );

            if (billyResponse && billyResponse.response) {
              await message.reply(billyResponse.response);
            }
          } catch (error) {
            console.error('[Billy] Error in start command:', error);
            message.reply("Olá! Sou Billy, seu agente de atendimento. Como posso ajudá-lo hoje?");
          }
          break;

        case "status":
          const dbStatus = await databaseService.healthCheck();
          const billyStatus = billyHandler.isConfigured() ? "✅ Ativo" : "⚠️ Modo Básico";

          message.reply(`*📊 Status do Sistema Billy*

🤖 *Billy:* ${billyStatus}
🗄️ *Database:* ${dbStatus.status === 'healthy' ? '✅ Conectado' : '❌ Desconectado'}
🔑 *OpenAI:* ${config.openai.apiKey !== 'ISI_APIKEY_OPENAI_DISINI' ? '✅ Configurado' : '❌ Não configurado'}

*Versão:* 3.0.0 - Billy, Agente X
*Modelo:* ${config.openai.model}

Digite qualquer mensagem para conversar comigo!`);
          break;
        case "ai": case "openai": case "chatgpt": case "ask":
          try {
            // tidak perlu diisi apikeynya disini, karena sudah diisi di file key.json
            if (setting.keyopenai === "ISI_APIKEY_OPENAI_DISINI") return message.reply("Apikey belum diisi\n\nSilahkan isi terlebih dahulu apikeynya di file key.json\n\nApikeynya bisa dibuat di website: https://beta.openai.com/account/api-keys");
            if (!text) return message.reply(`Chat dengan AI.\n\nContoh:\n${prefix}${command} Apa itu resesi`);
            const chatCompletion = await openai.chat.completions.create({
              messages: [{ role: 'user', content: q }],
              model: 'gpt-3.5-turbo'
            });

            await message.reply(chatCompletion.choices[0].message.content);
          } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
          } else {
            console.log(error);
            message.reply("Maaf, sepertinya ada yang error :"+ error.message);
          }
        }
          break;
        case "img": case "ai-img": case "image": case "images": case "dall-e": case "dalle":
          try {
            // tidak perlu diisi apikeynya disini, karena sudah diisi di file key.json
            if (setting.keyopenai === "ISI_APIKEY_OPENAI_DISINI") return message.reply("Apikey belum diisi\n\nSilahkan isi terlebih dahulu apikeynya di file key.json\n\nApikeynya bisa dibuat di website: https://beta.openai.com/account/api-keys");
            if (!text) return message.reply(`Membuat gambar dari AI.\n\nContoh:\n${prefix}${command} Wooden house on snow mountain`);
            const image = await openai.images.generate({
              model: "dall-e-3",
              prompt: q,
              n: 1,
              size: '1024x1024'
              });
            //console.log(response.data.data[0].url) // see the response
            sock.sendMessage(from,
              { image: { url: image.data[0].url }, caption: "DALE-E" },
              { quoted: message, ephemeralExpiration: message.contextInfo.expiration });
            } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
            console.log(`${error.response.status}\n\n${error.response.data}`);
          } else {
            console.log(error);
            message.reply("Maaf, sepertinya ada yang error :"+ error.message);
          }
        }
          break;
          case "sc": case "script": case "scbot":
           message.reply("Bot ini menggunakan script dari https://github.com/Sansekai/Wa-OpenAI");
          break
        default: {
          if (isCmd && budy.toLowerCase() != undefined) {
            if (message.chat.endsWith("broadcast")) return;
            if (message.isBaileys) return;
            if (!budy.toLowerCase()) return;
            if (argsLog || (isCmd && !message.isGroup)) {
              // sock.sendReadReceipt(message.chat, message.sender, [message.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            } else if (argsLog || (isCmd && message.isGroup)) {
              // sock.sendReadReceipt(message.chat, message.sender, [message.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            }
          }
        }
      }
    }
  } catch (err) {
    message.reply(util.format(err));
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
