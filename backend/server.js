const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const questionRoutes = require('./routes/questions');
const resultRoutes = require('./routes/results');
const portfolioRoutes = require('./routes/portfolio');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://infotest-platform.netlify.app',
  'https://infotest-action19.netlify.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin ends with .netlify.app
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, change in production
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'InfoTest API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'InfoTest Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      tests: '/api/tests',
      questions: '/api/questions',
      results: '/api/results',
      portfolio: '/api/portfolio',
      statistics: '/api/statistics'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
async function startServer() {
  try {
    // Ensure data directory exists (for Render)
    const fs = require('fs');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✓ Created data directory');
    }
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✓ Database connected');
    
    // Check if database needs initialization
    console.log('🔍 Checking database tables...');
    const checkTablesQuery = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `;
    const tables = await database.get(checkTablesQuery);
    
    if (!tables) {
      console.log('⚠️  Database not initialized. Running initialization...');
      
      // Import and run initialization
      const { initializeTables, seedData } = require('./scripts/initDatabase');
      await initializeTables(database);
      await seedData(database);
      
      console.log('✅ Database initialized successfully!');
    } else {
      console.log('✓ Database already initialized');
    }
    
    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 InfoTest Backend Server Started!');
      console.log(`📍 Server running on: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DB_PATH || 'infotest.db'}`);
      console.log(`\n✓ Ready to accept requests\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();

module.exports = app;
