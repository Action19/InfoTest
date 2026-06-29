const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Function to initialize tables (can be called with existing database connection)
async function initializeTables(db) {
  console.log('📝 Creating database tables...');

  try {
    // Drop existing tables (be careful in production!)
    const dropTables = [
      'DROP TABLE IF EXISTS user_achievements',
      'DROP TABLE IF EXISTS achievements',
      'DROP TABLE IF EXISTS statistics',
      'DROP TABLE IF EXISTS portfolio_items',
      'DROP TABLE IF EXISTS results',
      'DROP TABLE IF EXISTS test_attempts',
      'DROP TABLE IF EXISTS questions',
      'DROP TABLE IF EXISTS tests',
      'DROP TABLE IF EXISTS users'
    ];

    for (const sql of dropTables) {
      await db.run(sql);
    }
    console.log('✓ Existing tables dropped');

    // Create users table
    await db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
        avatar TEXT,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tests table
    await db.run(`
      CREATE TABLE tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT NOT NULL,
        duration INTEGER NOT NULL,
        total_questions INTEGER DEFAULT 0,
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        passing_score INTEGER DEFAULT 60,
        is_published BOOLEAN DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create questions table
    await db.run(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL CHECK(question_type IN (
          'single_choice', 'multiple_choice', 'true_false', 
          'short_answer', 'code_writing', 'matching'
        )),
        options TEXT,
        correct_answer TEXT NOT NULL,
        points INTEGER DEFAULT 1,
        explanation TEXT,
        image_url TEXT,
        order_number INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create test_attempts table
    await db.run(`
      CREATE TABLE test_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'abandoned')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create results table
    await db.run(`
      CREATE TABLE results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        score REAL NOT NULL,
        percentage REAL NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        time_taken INTEGER,
        answers TEXT,
        passed BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    // Create portfolio_items table
    await db.run(`
      CREATE TABLE portfolio_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        item_type TEXT CHECK(item_type IN ('project', 'achievement', 'test_result', 'certificate')),
        content TEXT,
        file_url TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create achievements table
    await db.run(`
      CREATE TABLE achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        badge_icon TEXT,
        criteria TEXT NOT NULL,
        points_reward INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_achievements table
    await db.run(`
      CREATE TABLE user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE(user_id, achievement_id)
      )
    `);

    // Create statistics table
    await db.run(`
      CREATE TABLE statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_tests_taken INTEGER DEFAULT 0,
        total_tests_passed INTEGER DEFAULT 0,
        average_score REAL DEFAULT 0,
        total_time_spent INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_activity DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id)
      )
    `);

    // Create indexes
    await db.run('CREATE INDEX idx_users_username ON users(username)');
    await db.run('CREATE INDEX idx_users_email ON users(email)');
    await db.run('CREATE INDEX idx_tests_created_by ON tests(created_by)');
    await db.run('CREATE INDEX idx_questions_test_id ON questions(test_id)');
    await db.run('CREATE INDEX idx_results_user_id ON results(user_id)');
    await db.run('CREATE INDEX idx_results_test_id ON results(test_id)');
    await db.run('CREATE INDEX idx_portfolio_user_id ON portfolio_items(user_id)');

    console.log('✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  }
}

// Function to seed demo data
async function seedData(db) {
  console.log('🌱 Seeding demo data...');

  try {
    // Create demo users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    // Admin
    const adminResult = await db.run(`
      INSERT INTO users (username, email, password, full_name, role, points, level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@infotest.uz', adminPassword, 'Administrator', 'admin', 0, 1]);
    
    // Teacher
    const teacherResult = await db.run(`
      INSERT INTO users (username, email, password, full_name, role, bio, points, level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['o_qituvchi', 'teacher@infotest.uz', teacherPassword, "O'qituvchi Javobi", 'teacher', 
        "Matematika va Informatika fanlari o'qituvchisi", 0, 1]);

    // Student
    const studentResult = await db.run(`
      INSERT INTO users (username, email, password, full_name, role, bio, points, level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['akmal_yusupov', 'akmal@infotest.uz', studentPassword, 'Akmal Yusupov', 'student',
        '10-sinf o\'quvchisi, dasturlashga qiziqadi', 150, 2]);

    // Create statistics for users
    await db.run('INSERT INTO statistics (user_id) VALUES (?)', [adminResult.id]);
    await db.run('INSERT INTO statistics (user_id) VALUES (?)', [teacherResult.id]);
    await db.run('INSERT INTO statistics (user_id) VALUES (?)', [studentResult.id]);

    console.log('✅ Demo users created successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Admin: admin / admin123');
    console.log('   Teacher: o_qituvchi / teacher123');
    console.log('   Student: akmal_yusupov / student123\n');

  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    throw error;
  }
}

// Standalone initialization (for direct script execution)
async function initDatabase() {
  const database = require('../config/database');
  
  console.log('🔧 Initializing InfoTest Database...\n');

  try {
    await database.connect();
    await initializeTables(database);
    await seedData(database);
    console.log('✅ Database initialization completed successfully!\n');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase, initializeTables, seedData };
