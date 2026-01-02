const { getDatabase, initDatabase } = require('../database/db');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    await initDatabase();
    
    const db = getDatabase();
    const username = 'gg';
    const email = 'gg@mail.ru';
    const password = 'Qwerty123';

    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      console.log('Пользователь уже существует:');
      console.log(`ID: ${existingUser.id}`);
      console.log(`Username: ${existingUser.username}`);
      console.log(`Email: ${existingUser.email}`);
      db.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    console.log('✓ Пользователь успешно создан!');
    console.log(`ID: ${userId}`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    db.close();
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    process.exit(1);
  }
}

createUser();
