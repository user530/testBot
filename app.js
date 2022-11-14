// Config dotenv
require(`dotenv`).config();

// Set env variable
const apiToken = process.env.API_TOKEN;

// Import Telegram Bot module
const TelegramBot = require(`node-telegram-bot-api`);

// Telegram bot instance
const bot = new TelegramBot(apiToken, { polling: true });

// Load and set default options
const axios = require(`axios`);
const { captureRejectionSymbol } = require("node-telegram-bot-api");
axios.default;

// Ответ на сообщение
bot.onText(/\/start/, (msg) => {
  // Открывающее сообщение
  bot.sendMessage(
    msg.chat.id,
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

// Обработка команды "Старт"
bot.onText(/^старт$/i, (msg, match) => {
  const {
    message_id: messageId,
    from: { id: userId, first_name: userName },
    chat: { id: chatId },
    date,
  } = msg;

  // Check that message is from the DM
  if (chatId === userId) {
    bot.sendMessage(
      chatId,
      `Пришлите мне кадастровый номер объекта недвижимости в формате 47:14:1203001:814\nВ ответ напишу, что там было интересного в истории`
    );

    bot.on(`message`, validateNumb);
  }
  //   If message from chat
  else {
    bot.sendMessage(chatId, `Вы в чате, ничего не скажу =Р`);
    bot.emit(`topkek`, userId, chatId, { top: `kek` });
  }
});

bot.on(`topkek`, (userId, chatId, arg3) => {});

bot.onText(/^Запросить подробный отчёт: \d{2}:\d{2}:\d{7}:\d{3}$/i, (msg) => {
  const {
    message_id: messageId,
    from: { id: userId, first_name: userName },
    chat: { id: chatId },
    date: msgDate,
    text: userMsg,
  } = msg;

  const kn = userMsg.split(` `).slice(-1)[0];

  const url = `http://pro.bezopasno.org/services/riskIndicator?kn=${kn}&utm_content=rinat,${userId},${chatId},${false}`;

  bot.sendMessage(chatId, url);
});

const validateNumb = async (msg) => {
  const {
    message_id: messageId,
    from: { id: userId, first_name: userName },
    chat: { id: chatId },
    date: msgDate,
    text: userMsg,
  } = msg;

  const match = userMsg.match(/^(\d{2}:\d{2}:\d{7}:\d{3})$/i);

  if (!match)
    bot.sendMessage(
      chatId,
      `Уточните формат кадастрового номера! Верный формат 47:14:1203001:814.\nПопробуйте еще раз. Спасибо.`
    );
  else {
    bot.sendMessage(chatId, `Ищу данные, подождите 10-15 секунд...`);

    const url = `http://api.bezopasno.org/services/riskIndicator?kn=${userMsg}&utm_content=rinat,${userId},${chatId},${false}`;

    // Запрос к базе
    axios
      .get(url)

      //   Ответ получен
      .then((res) => {
        // Деструктуризируем ответ
        const {
          data: {
            data: {
              message: reqMsg,
              result: {
                addresses: reqAddr,
                status: { rights: reqRght, encumbrances: reqEnc },
              },
            },
          },
        } = res;

        // Подготовить сообщения
        const answer1 = `${reqMsg}!\nАдрес(а): ${reqAddr.join(
          `;\n`
        )}.\nО правах: ${reqRght}\nОб ограничениях: ${reqEnc}`;

        const answer2 = `Детализированный отчёт с рекомендациями можно заказать по ссылке: https://pro.bezopasno.org/`;

        // Отправить сообщения
        bot.sendMessage(chatId, answer1);
        bot.sendMessage(chatId, answer2, {
          reply_markup: {
            keyboard: [[`Запросить подробный отчёт: ${userMsg}`]],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
          },
        });
      })

      //   Ошибка при запросе
      .catch((err) => {
        // Отправить сообщение об ошибке
        bot.sendMessage(
          chatId,
          `Что-то пошло не так...Попробуйте повторить позже, или обратитесь в тех.поддержку!`
        );
      });

    // Перестаем ожидать и проверять кадастровый номер
    bot.removeListener(`message`);
  }
};
