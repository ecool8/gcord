const { sequelize } = require('../database/sequelize');
const { User } = require('../models');
const { Op } = require('sequelize');

async function createUser() {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Синхронизируем модели
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');

    const username = 'user';
    const email = 'e@mail.ru';
    const password = 'Qwerty123';

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      console.log('Пользователь уже существует:');
      console.log(`ID: ${existingUser.id}`);
      console.log(`Username: ${existingUser.username}`);
      console.log(`Email: ${existingUser.email}`);
      await sequelize.close();
      return;
    }

    // Создаем пользователя
    const user = await User.create({
      username,
      email,
      password // Пароль автоматически захешируется через hook в модели
    });

    console.log('✅ Пользователь успешно создан!');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createUser();
