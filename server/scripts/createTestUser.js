const { getDatabase } = require('../database/db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const db = getDatabase();
  const username = 'testuser';
  const email = 'test@example.com';
  const password = 'test123';

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      console.log('Тестовый пользователь уже существует:');
      console.log(`ID: ${existingUser.id}, Username: ${existingUser.username}, Email: ${existingUser.email}`);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const userId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    console.log('Тестовый пользователь создан:');
    console.log(`ID: ${userId}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
  } finally {
    db.close();
  }
}

// Запускаем скрипт
const { initDatabase } = require('../database/db');
initDatabase().then(() => {
  createTestUser();
}).catch(err => {
  console.error('Ошибка инициализации базы данных:', err);
  process.exit(1);
});

