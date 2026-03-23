const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// База данных будет файле dorm.db в папке backend
const db = new sqlite3.Database(path.join(__dirname, 'dorm.db'));

// Создаем таблицы
db.serialize(() => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE,
            role TEXT,
            first_name TEXT,
            last_name TEXT,
            room_number TEXT,
            building TEXT
        )
    `);

    // Таблица заявок
    db.run(`
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            who_needed TEXT,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            room_number TEXT,
            building TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Добавляем админа
    db.run(`INSERT OR IGNORE INTO users (phone, role) VALUES ('89175646744', 'admin')`);

    console.log('✅ База данных готова');
});

module.exports = db;