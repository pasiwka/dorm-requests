const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// База данных в файле dorm.db в папке backend
const db = new sqlite3.Database(path.join(__dirname, 'dorm.db'));

db.serialize(() => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             phone TEXT UNIQUE,
                                             password TEXT,
                                             role TEXT,
                                             first_name TEXT,
                                             last_name TEXT,
                                             room_number TEXT,
                                             building TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы users:', err.message);
        } else {
            console.log('✅ Таблица users создана/проверена');
        }
    });

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
    `, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы requests:', err.message);
        } else {
            console.log('✅ Таблица requests создана/проверена');
        }
    });

    // После создания таблиц добавляем пользователей
    setTimeout(() => {
        // Очищаем таблицу от старых данных, чтобы избежать конфликтов
        db.run(`DELETE FROM users`, (err) => {
            if (err) {
                console.error('Ошибка очистки таблицы users:', err.message);
            } else {
                console.log('✅ Таблица users очищена');
            }
        });

        // Добавляем админа (по номеру из твоего server.js)
        db.run(`
            INSERT INTO users (phone, password, role, first_name, last_name)
            VALUES ('89175646744', 'o1p2m3m444', 'admin', 'Ольга', 'Павлюченкова')
        `, (err) => {
            if (err) {
                console.error('Ошибка добавления админа:', err.message);
            } else {
                console.log('✅ Админ добавлен: Ольга Павлюченкова (89175646744)');
            }
        });

        // Добавляем студента
        db.run(`
            INSERT INTO users (phone, password, role, first_name, last_name) 
            VALUES ('89174566722', '11111111', 'student', 'Иван', 'Иванов')
        `, (err) => {
            if (err) {
                console.error('Ошибка добавления студента:', err.message);
            } else {
                console.log('✅ Студент добавлен: Иван Иванов (89174566722)');
            }
        });

        // Проверяем, что добавилось
        setTimeout(() => {
            db.all(`SELECT id, phone, role, first_name, last_name FROM users`, [], (err, users) => {
                if (err) {
                    console.error('Ошибка проверки:', err.message);
                } else {
                    console.log('\n📋 Текущие пользователи в БД:');
                    users.forEach(user => {
                        console.log(`   - ${user.first_name} ${user.last_name} (${user.phone}) - ${user.role}`);
                    });
                }
            });
        }, 100);
    }, 100);
});

module.exports = db;