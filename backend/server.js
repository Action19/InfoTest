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
const lessonRoutes = require('./routes/lessons');
const assignmentRoutes = require('./routes/assignments');
const lessonProgressRoutes = require('./routes/lessonProgress');

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
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lesson-progress', lessonProgressRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
async function runMigrations(db) {
  try {
    // assignments table
    await db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        id            SERIAL PRIMARY KEY,
        lesson_id     INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        created_by    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title         TEXT NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        task_type     TEXT NOT NULL CHECK(task_type IN (
          'word','excel','access','python','scratch','html','javascript','css','other'
        )),
        instructions  TEXT NOT NULL,
        max_score     INTEGER DEFAULT 100,
        deadline      TIMESTAMPTZ,
        ai_generated  BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // assignment_submissions table
    await db.run(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id              SERIAL PRIMARY KEY,
        assignment_id   INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name       TEXT NOT NULL,
        file_path       TEXT NOT NULL,
        file_size       INTEGER,
        submitted_at    TIMESTAMPTZ DEFAULT NOW(),
        score           INTEGER,
        feedback        TEXT,
        graded_by       TEXT CHECK(graded_by IN ('teacher','ai')),
        graded_at       TIMESTAMPTZ,
        ai_report       TEXT,
        status          TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','graded')),
        UNIQUE(assignment_id, student_id)
      )
    `);
    await db.run('CREATE INDEX IF NOT EXISTS idx_assignments_lesson  ON assignments(lesson_id)').catch(()=>{});
    await db.run('CREATE INDEX IF NOT EXISTS idx_submissions_assign  ON assignment_submissions(assignment_id)').catch(()=>{});
    await db.run('CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id)').catch(()=>{});

    // lesson_progress
    await db.run(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id                SERIAL PRIMARY KEY,
        lesson_id         INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        student_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_possible    INTEGER DEFAULT 0,
        earned_score      INTEGER DEFAULT 0,
        percent           REAL DEFAULT 0,
        grade             INTEGER DEFAULT 0,
        grade_awarded     BOOLEAN DEFAULT FALSE,
        updated_at        TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(lesson_id, student_id)
      )
    `);
    await db.run('CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id)').catch(()=>{});
    await db.run('CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson  ON lesson_progress(lesson_id)').catch(()=>{});

    // Demo foydalanuvchilarni o'chirish (dilshod_karimov, madina_rashidova)
    try {
      const demoUsers = await db.all(
        `SELECT id FROM users WHERE username IN ('dilshod_karimov', 'madina_rashidova')`
      );
      for (const u of demoUsers) {
        await db.run('DELETE FROM users WHERE id = ?', [u.id]);
      }
      if (demoUsers.length > 0) {
        console.log(`✓ Removed ${demoUsers.length} demo user(s): dilshod_karimov, madina_rashidova`);
      }
    } catch (e) {
      console.error('Demo user cleanup error (non-fatal):', e.message);
    }

    console.log('✓ Migrations applied');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }
}

async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✓ Database connected');
    
    // Check if tables exist (PostgreSQL information_schema)
    console.log('🔍 Checking database tables...');
    const checkTablesQuery = `
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    const tables = await database.get(checkTablesQuery);
    
    if (!tables) {
      console.log('⚠️  Database not initialized. Running initialization...');
      const { initializeTables, seedData } = require('./scripts/initDatabase');
      await initializeTables(database);
      await seedData(database);
      console.log('✅ Database initialized successfully!');
    } else {
      console.log('✓ Database already initialized');
      // Run incremental migrations for new tables
      await runMigrations(database);
    }
    
    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 InfoTest Backend Server Started!');
      console.log(`📍 Server running on: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: PostgreSQL (${process.env.DATABASE_URL ? 'connected' : 'no URL set'})`);
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
