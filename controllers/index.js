const f1 = async (req, res, next) => {
  console.log(res.user);
  return res.status(200).send(`Приветствую! Меня зовут Р.И.Н.А.Т.
  Покажу риск индикатор по любой недвижимости. 
  Бесплатно. Это важно перед покупкой или продажей.
  Нажми "Старт"`);
};
const f2 = async (req, res, next) => {};
const f3 = async (req, res, next) => {};

module.exports = { f1, f2, f3 };
