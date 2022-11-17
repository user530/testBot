// Import Bot instance and main functions
const { bot, welcome, requestKn, handleKn, redirect } = require(`./functions`);

// Handle start command
bot.onText(/\/start/, welcome);

// Handle "Старт" button click
bot.onText(/^старт$/i, requestKn);

// Handle messages
bot.on(`message`, handleKn);

// Handle advanced
bot.onText(/^Запросить подробный отчёт: \d{2}:\d{2}:\d{7}:\d{3}$/i, redirect);

// Log start
console.log(`Bot is up and running at port: ${process.env.PORT}...`);
