const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

// Database
const { sequelize } = require('./database/sequelize');
const { setupSocketIO } = require('./socket/socketHandler');

// Load environment variables
// Try to load from secret file first (Render), then from .env
const fs = require('fs');
const secretEnvPath = '/etc/secrets/.env.production';
const localEnvPath = path.join(__dirname, '../.env.production');

if (fs.existsSync(secretEnvPath)) {
  // Load from Render secret file
  dotenv.config({ path: secretEnvPath });
  console.log('✅ Loaded environment from Render secret file');
} else if (fs.existsSync(localEnvPath)) {
  // Load from local .env.production
  dotenv.config({ path: localEnvPath });
  console.log('✅ Loaded environment from .env.production');
} else {
  // Load from default .env or environment variables
  dotenv.config();
  console.log('✅ Loaded environment from .env or system variables');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  // Проверяем существование папки build
  const fs = require('fs');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    console.log('✅ Serving React build from:', buildPath);
  } else {
    console.warn('⚠️  React build directory not found:', buildPath);
    console.warn('⚠️  Make sure "npm run build" was executed successfully');
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Пропускаем API запросы
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(__dirname, '../client/build/index.html');
    const fs = require('fs');
    
    // Логируем путь для отладки
    console.log('Looking for index.html at:', indexPath);
    console.log('Current __dirname:', __dirname);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Показываем более детальную информацию об ошибке
      const buildDir = path.join(__dirname, '../client/build');
      const clientDir = path.join(__dirname, '../client');
      console.error('Build directory exists:', fs.existsSync(buildDir));
      console.error('Client directory exists:', fs.existsSync(clientDir));
      console.error('Full build path:', indexPath);
      
      res.status(500).json({ 
        error: 'React app not built', 
        message: 'Please run "npm run build" to build the React application',
        buildPath: indexPath,
        buildDirExists: fs.existsSync(buildDir),
        clientDirExists: fs.existsSync(clientDir)
      });
    }
  });
}

// Setup Socket.IO
setupSocketIO(io);

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync database models
    // В продакшене синхронизируем только если таблиц нет
    if (process.env.NODE_ENV !== 'production') {
      // Для SQLite используем более безопасную синхронизацию
      const isSQLite = sequelize.getDialect() === 'sqlite';
      if (isSQLite) {
        await sequelize.sync({ force: false });
      } else {
        await sequelize.sync({ alter: true });
      }
      console.log('✅ Database models synchronized');
    } else {
      // В продакшене синхронизируем без alter (безопаснее)
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized (production)');
    }

    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
