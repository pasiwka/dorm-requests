const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ============= API ЭНДПОИНТЫ =============

// 1. Вход по телефону
app.post('/api/login', (req, res) => {
    const { phone } = req.body;

    db.get(`SELECT * FROM users WHERE phone = ?`, [phone], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (user) {
            res.json({ success: true, role: user.role, user: user });
        } else {
            // Новый студент
            db.run(`INSERT INTO users (phone, role) VALUES (?, 'student')`, [phone], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (err, newUser) => {
                    res.json({ success: true, role: 'student', user: newUser });
                });
            });
        }
    });
});

// 2. Заполнение профиля
app.put('/api/profile', (req, res) => {
    const { userId, firstName, lastName, roomNumber, building } = req.body;

    db.run(`
        UPDATE users 
        SET first_name = ?, last_name = ?, room_number = ?, building = ?
        WHERE id = ?
    `, [firstName, lastName, roomNumber, building, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// 3. Создать заявку
app.post('/api/requests', (req, res) => {
    const { userId, whoNeeded, description, roomNumber, building } = req.body;

    db.run(`
        INSERT INTO requests (user_id, who_needed, description, room_number, building)
        VALUES (?, ?, ?, ?, ?)
    `, [userId, whoNeeded, description, roomNumber, building], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, requestId: this.lastID });
    });
});

// 4. Получить заявки студента
app.get('/api/requests/:userId', (req, res) => {
    const userId = req.params.userId;

    db.all(`SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, requests) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(requests);
    });
});

// 5. Админ: получить все заявки
app.get('/api/admin/requests', (req, res) => {
    db.all(`
        SELECT requests.*, users.first_name, users.last_name 
        FROM requests 
        JOIN users ON requests.user_id = users.id
        ORDER BY created_at DESC
    `, [], (err, requests) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(requests);
    });
});

// 6. Админ: изменить статус заявки
app.put('/api/admin/requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run(`UPDATE requests SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
// Временный эндпоинт для проверки базы
app.get('/api/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(users);
    });
});