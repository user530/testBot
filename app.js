// Import Bot instance and main functions
const { bot, welcome, requestKn, handleKn, redirect } = require(`./functions`);

// Handle /start cmd or "Старт" cmd word
bot.onText(/^\/start|старт$/i, requestKn);

// Handle advanced
bot.onText(/^Запросить подробный отчёт$/i, redirect);

// Handle messages
bot.on(`message`, handleKn);

// Log start
console.log(`Bot is up and running at port: ${process.env.PORT}...`);
