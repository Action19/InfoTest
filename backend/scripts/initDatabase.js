const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function initDatabase() {
  console.log('🔧 Initializing InfoTest Database...\n');

  try {
    // Ensure database directory exists
    const dbDir = path.resolve(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('✓ Created database directory');
    }

    await database.connect();

    // Drop existing tables (be careful in production!)
    console.log('\n⚠️  Dropping existing tables...');
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
      await database.run(sql);
    }
    console.log('✓ Existing tables dropped');

    // Create users table
    console.log('\n📝 Creating tables...');
    await database.run(`
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
    console.log('✓ Created users table');

    // Create tests table
    await database.run(`
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
    console.log('✓ Created tests table');

    // Create questions table
    await database.run(`
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
    console.log('✓ Created questions table');

    // Create test_attempts table
    await database.run(`
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
    console.log('✓ Created test_attempts table');

    // Create results table
    await database.run(`
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
    console.log('✓ Created results table');

    // Create portfolio_items table
    await database.run(`
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
    console.log('✓ Created portfolio_items table');

    // Create achievements table
    await database.run(`
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
    console.log('✓ Created achievements table');

    // Create user_achievements table
    await database.run(`
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
    console.log('✓ Created user_achievements table');

    // Create statistics table
    await database.run(`
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
    console.log('✓ Created statistics table');

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    await database.run('CREATE INDEX idx_users_username ON users(username)');
    await database.run('CREATE INDEX idx_users_email ON users(email)');
    await database.run('CREATE INDEX idx_tests_created_by ON tests(created_by)');
    await database.run('CREATE INDEX idx_questions_test_id ON questions(test_id)');
    await database.run('CREATE INDEX idx_results_user_id ON results(user_id)');
    await database.run('CREATE INDEX idx_results_test_id ON results(test_id)');
    await database.run('CREATE INDEX idx_portfolio_user_id ON portfolio_items(user_id)');
    console.log('✓ Created indexes');

    console.log('\n✅ Database initialization completed successfully!\n');

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

module.exports = initDatabase;
