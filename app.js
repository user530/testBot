// Import Bot instance and main functions
const { bot, requestKn, handleKn } = require(`./functions`);

// Handle /start cmd or "Старт" cmd word
bot.onText(/^\/start$/i, requestKn);

// Handle messages
bot.on(`message`, handleKn);

// Log start
console.log(`Bot is up and running at port: ${process.env.PORT}...`);
