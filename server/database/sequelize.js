const { Sequelize } = require('sequelize');

// Database configuration
// Для локальной разработки можно использовать SQLite, если PostgreSQL не установлен
const useSQLite = process.env.USE_SQLITE === 'true' || (!process.env.DATABASE_URL && !process.env.DB_NAME);

let sequelize;

if (useSQLite) {
  // SQLite для локальной разработки
  const path = require('path');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
  console.log('📦 Using SQLite for local development');
} else {
  // PostgreSQL для продакшена
  sequelize = new Sequelize(
    process.env.DATABASE_URL || process.env.DB_NAME || 'analog_discord',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: process.env.DATABASE_URL ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    }
  );
  console.log('🐘 Using PostgreSQL');
}

module.exports = { sequelize };

