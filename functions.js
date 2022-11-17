// Config dotenv
require(`dotenv`).config();

// Set env variable
const apiToken = process.env.API_TOKEN;

// Import Telegram Bot module
const TelegramBot = require(`node-telegram-bot-api`);

// Telegram bot instance
const bot = new TelegramBot(apiToken, { polling: true });

// Prepare variable to keep track of users awaiting answer
bot.waitingUsers = [];

// Load and set default options
const axios = require(`axios`);
axios.default;

// Wrapper function
const wrapper = (cb) => {
  return (msg) => {
    // Destructure the message
    const {
      from: { id: userId, first_name: userName },
      chat: { id: chatId },
      text: userMsg,
    } = msg;

    // Execute the logic with message data
    cb(userId, userMsg, userName, chatId);
  };
};

// Initial greeting
const welcome = wrapper((userId, userMsg, userName, chatId) => {
  bot.sendMessage(
    chatId,
    `Приветствую! Меня зовут Р.И.Н.А.Т.\nПокажу риск индикатор по любой недвижимости.Бесплатно. Это важно перед покупкой или продажей.\nНажми "Старт""`,
    {
      reply_markup: {
        keyboard: [["Старт"]],
        resize_keyboard: true,
        one_time_keyboard: true,
        force_reply: true,
      },
    }
  );
});

// Request KN and add to the list
const requestKn = wrapper((userId, userMsg, userName, chatId) => {
  // No reaction for the chat messages
  if (userId !== chatId) return;

  // Send message
  bot.sendMessage(
    chatId,
    `Пришлите мне кадастровый номер объекта недвижимости в формате 47:14:1203001:814\nВ ответ напишу, что там было интересного в истории`
  );

  // Add user to the waiting list if he's not there
  if (!inWaitlist(userId)) addWaitlist(userId);
});

// Handle request of the number
const handleKn = wrapper(async (userId, userMsg, userName, chatId) => {
  if (userId === chatId) handleDM(userId, userMsg, userName, chatId);
  else handleChat(userId, userMsg, userName, chatId);
});

// Number request in DM chat
const handleDM = async (userId, userMsg, userName, chatId) => {
  // User is not in the wait list -> ignore
  if (!inWaitlist(userId)) return;

  // Check the format
  if (!userMsg.match(/^(\d{2}:\d{2}:\d{7}:\d{3})$/i)) {
    // Signal wrong format and stop
    bot.sendMessage(
      chatId,
      `Уточните формат кадастрового номера! Верный формат 47:14:1203001:814.\nПопробуйте еще раз. Спасибо.`
    );
    return;
  }

  // Signal start
  bot.sendMessage(chatId, `Ищу данные, подождите 10-15 секунд...`);

  // Fetch the data
  const { msg, addr, rights, encumb } = await getData(
    userMsg,
    userId,
    chatId,
    `???`
  );

  // Failed to get result
  if (!(msg && addr && rights && encumb))
    bot.sendMessage(
      chatId,
      `К сожалению, мы не нашли никакой информации по данному номеру. Попробуйте повторить попытку позднее или используйте другой номер.`
    );
  // Result aquired
  else {
    // First msg
    await bot.sendMessage(chatId, `Отчёт по объекту: ${userMsg}`);

    // Second msg
    await bot.sendMessage(
      userId,
      `${msg}!\nАдрес(а): ${addr.join(
        `;\n`
      )}.\nО правах: ${rights}\nОб ограничениях: ${encumb}`
    );

    // Third msg
    await bot.sendMessage(
      userId,
      `Детализированный отчёт с рекомендациями можно заказать по ссылке: https://pro.bezopasno.org/`,
      {
        reply_markup: {
          keyboard: [[`Запросить подробный отчёт: ${userMsg}`]],
          resize_keyboard: true,
          one_time_keyboard: true,
          force_reply: true,
        },
      }
    );
  }

  // Remove user from the wait list
  delWaitlist(userId);
};

// Number request in global chat
const handleChat = async (userId, userMsg, userName, chatId) => {
  // Check the format
  if (!userMsg.match(/^(\d{2}:\d{2}:\d{7}:\d{3})$/i)) {
    // Signal wrong format and stop
    bot.sendMessage(
      chatId,
      `Уточните формат кадастрового номера! Верный формат 47:14:1203001:814.\nПопробуйте еще раз. Спасибо.`
    );
    return;
  }

  try {
    await bot
      // Check that direct chat is opened
      .sendMessage(userId, `@${userName}, ваш запрос обрабатывается.`);
    // Signal start
    bot.sendMessage(
      chatId,
      `@${userName} Запрос принял! Выполняю...\nОжидание 10-15 секунд`
    );
  } catch (err) {
    // Warn and stop
    bot.sendMessage(
      chatId,
      `@${userName}!\nС удовольствием вам помогу)\nДля этого надо\n■ Зайти ко мне в личные сообщения t.me/bs_rinat_bot\n■ Нажать кнопку Старт\n■ Повторить запрос`
    );
    return;
  }

  // Fetch the data
  const { msg, addr, rights, encumb } = await getData(
    userMsg,
    userId,
    chatId,
    `???`
  );

  // Failed to get result
  if (!(msg && addr && rights && encumb))
    bot.sendMessage(
      chatId,
      `К сожалению, мы не нашли никакой информации по данному номеру. Попробуйте повторить попытку позднее или используйте другой номер.`
    );
  // Result aquired
  else {
    // First msg
    await bot.sendMessage(
      chatId,
      `@${userName} Отчёт готов. Объект найден. Подробности в личных сообщениях: t.me/bs_rinat_bot`
    );

    // Second msg
    await bot.sendMessage(
      userId,
      `${msg}!\nАдрес(а): ${addr.join(
        `;\n`
      )}.\nО правах: ${rights}\nОб ограничениях: ${encumb}`
    );
    // Third msg
    await bot.sendMessage(
      userId,
      `Детализированный отчёт с рекомендациями можно заказать по ссылке: https://pro.bezopasno.org/`,
      {
        reply_markup: {
          keyboard: [[`Запросить подробный отчёт: ${userMsg}`]],
          resize_keyboard: true,
          one_time_keyboard: true,
          force_reply: true,
        },
      }
    );
  }
};

// Send redirect link
const redirect = wrapper((userId, userMsg, userName, chatId) => {
  // Only in DM
  if (userId !== chatId) return;

  // Get number
  const kn = userMsg.split(` `).slice(-1)[0];

  // Create URL
  const url = `http://pro.bezopasno.org/services/riskIndicator?kn=${kn}&utm_content=rinat,${userId},${chatId},${false}`;

  // Send it
  bot.sendMessage(chatId, url);
});

// Check if ID in waitlist
const inWaitlist = (userId) => {
  return bot.waitingUsers.find((id) => id === userId);
};

// Add ID to waitlist
const addWaitlist = (userId) => {
  if (bot.waitingUsers.indexOf(userId) === -1) bot.waitingUsers.push(userId);
};

// Delete ID from waitlist
const delWaitlist = (userId) => {
  bot.waitingUsers.splice(bot.waitingUsers.indexOf(userId), 1);
};

// Get the data from the number
const getData = async (userMsg, userId, chatId, idPartner) => {
  // Prepare the result variable
  const res = {};

  // Prepare URL
  const url = `http://api.bezopasno.org/services/riskIndicator?kn=${userMsg}&utm_content=rinat,${userId},${chatId},${idPartner}`;

  // Make a request
  try {
    // Axios request
    const data = await axios.get(url);

    // Destructure the data
    ({
      data: {
        data: {
          message: res.msg,
          result: {
            addresses: res.addr,
            status: { rights: res.rights, encumbrances: res.encumb },
          },
        },
      },
    } = data);

    // Return the result
    return res;
  } catch {
    // Handle request errors
    return false;
  }
};

module.exports = {
  bot,
  welcome,
  requestKn,
  handleKn,
  redirect,
};
