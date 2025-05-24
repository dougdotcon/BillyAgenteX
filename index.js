process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Billy, Agente X - Enhanced WhatsApp Bot
const {
	makeWASocket,
	fetchLatestBaileysVersion,
	DisconnectReason,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
	makeInMemoryStore,
	Browsers,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const Pino = require("pino");
const chalk = require("chalk");
const moment = require("moment-timezone");

// Billy services
const config = require("./config");
const databaseService = require("./src/services/database");
const sessionService = require("./src/services/sessionService");
const { Messages } = require("./lib/messages.js");

// Set timezone based on config
moment.tz.setDefault(config.billy.timezone).locale(config.billy.language.split('-')[0]);

const donet = "https://saweria.co/sansekai";

// Baileys
const Logger = {
	level: "error",
};
const logger = Pino({
	...Logger,
});
const Store = (log = logger) => {
	const store = makeInMemoryStore({ logger: log });
	return store;
};
const store = Store(logger);
store?.readFromFile("./session.json");

setInterval(() => {
	store?.writeToFile("./session.json");
}, 10_000);

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

// Initialize Billy services
async function initializeBilly() {
	console.log(color("🤖 Initializing Billy, Agente X...", "cyan"));

	try {
		// Connect to database
		await databaseService.connect();
		await databaseService.initializeData();
		databaseService.startCleanupSchedule();

		// Start session cleanup
		sessionService.startCleanupInterval();

		console.log(color("✅ Billy services initialized successfully", "green"));
	} catch (error) {
		console.error(color("❌ Error initializing Billy services:", "red"), error);
		console.log(color("⚠️ Billy will run in basic mode without database", "yellow"));
	}
}

async function connectToWhatsApp() {
	const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.sessionName);

	const { version } = await fetchLatestBaileysVersion();
	const sock = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		version: version,
		logger: logger,
		printQRInTerminal: config.whatsapp.printQR,
    markOnlineOnConnect: config.whatsapp.markOnline,
		generateHighQualityLinkPreview: true,
		browser: config.whatsapp.browser,
    getMessage
	});

	store?.bind(sock.ev);

	sock.ev.process(async (ev) => {
		if (ev["creds.update"]) {
			await saveCreds();
		}
		if (ev["connection.update"]) {
			console.log("Connection update", ev["connection.update"]);
			const update = ev["connection.update"];
			const { connection, lastDisconnect } = update;
			if (connection === "close") {
				const shouldReconnect =
					lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
				console.log(
					"connection closed due to ",
					lastDisconnect.error,
					", reconnecting ",
					shouldReconnect
				);
				// reconnect if not logged out
				if (shouldReconnect) {
					connectToWhatsApp();
				}
			} else if (connection === "open") {
        const botNumber = sock.user.id
				console.log("opened connection");
        console.log(color("🤖 Billy, Agente X connected successfully!", "green"));
        console.log(color("📱 WhatsApp Bot is ready for customer service", "cyan"));
        console.log(color("💡 Type /menu to see available commands", "yellow"));
        console.log(color("🔗 Support the creator: https://saweria.co/sansekai", "magenta"));

        // Initialize Billy services after connection
        await initializeBilly();

        sock.sendMessage(botNumber, {
          text: `🤖 *Billy, Agente X está online!*\n\n✅ Sistema de atendimento ativo\n🎯 Pronto para ajudar com apólices e pagamentos\n\n💡 Digite /menu para ver as opções\n\n🔗 ${donet}`
        });
			}
		}
    // sock.ev.on("messages.upsert", async (message) => {
    //   console.log(message);
    // })

		const upsert = ev["messages.upsert"];
if (upsert) {
	if (upsert.type !== "notify") {
        return;
    }
    const message = Messages(upsert, sock);
    if (!message || message.sender === "status@broadcast") {
        return;
    }
    // msgHandler(upsert, sock, store, message);
	require("./sansekai.js")(upsert, sock, store, message);
 }


    //   const message = Messages(upsert, sock);
    //   console.log(message);
		// }
	});
	/**
	 *
	 * @param {import("@whiskeysockets/baileys").WAMessageKey} key
	 * @returns {import("@whiskeysockets/baileys").WAMessageContent | undefined}
	 */
	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id);
			return msg?.message || undefined;
		}
		// only if store is present
		return proto.Message.fromObject({});
	}
	return sock;
}
connectToWhatsApp()
// Baileys

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});