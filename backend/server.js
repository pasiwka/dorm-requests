const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;

    db.get(`SELECT * FROM users WHERE phone = ?`, [phone], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
        if (password !== user.password) return res.status(401).json({ error: 'Неверный пароль' });

        res.json({
            success: true,
            user: {
                id: user.id,
                phone: user.phone,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    });
});
app.get('/api/users/:userId', (req, res) => {
    const { userId } = req.params;

    db.get(`
        SELECT u.id, u.first_name, u.last_name, u.phone, u.role,
               r.room_number, b.name as building_name
        FROM users u
                 LEFT JOIN residencies res ON u.id = res.user_id AND res.is_current = 1
                 LEFT JOIN rooms r ON res.room_id = r.id
                 LEFT JOIN buildings b ON r.building_id = b.id
        WHERE u.id = ?
    `, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        res.json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: user.role,
            room: user.room_number ? {
                room_number: user.room_number,
                building_name: user.building_name
            } : null
        });
    });
});
app.put('/api/users/:userId', (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name } = req.body;

    db.run(`
        UPDATE users
        SET first_name = ?, last_name = ?
        WHERE id = ?
    `, [first_name, last_name, userId], function(err) {
        if (err) {
            console.error('Ошибка обновления:', err);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ success: true, message: 'Данные обновлены' });
    });
});
app.post('/api/rooms/find', (req, res) => {
    const { building_name, room_number } = req.body;

    db.get(`
        SELECT r.id, r.room_number, b.name as building_name
        FROM rooms r
                 JOIN buildings b ON r.building_id = b.id
        WHERE b.name = ? AND r.room_number = ?
    `, [building_name, room_number], (err, room) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!room) return res.status(404).json({ error: 'Комната не найдена' });
        res.json(room);
    });
});
app.put('/api/residencies/:userId', (req, res) => {
    const { userId } = req.params;
    const { room_id, is_current } = req.body;

    db.run(`UPDATE residencies SET is_current = 0 WHERE user_id = ?`, [userId]);

    db.run(`
        INSERT INTO residencies (user_id, room_id, is_current, moved_in)
        VALUES (?, ?, ?, date('now'))
    `, [userId, room_id, is_current ? 1 : 0], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/requests', (req, res) => {
    db.all(`
        SELECT r.*, u.first_name, u.last_name, c.name as category_name, rm.room_number, b.name as building_name
        FROM requests r
                 JOIN users u ON r.user_id = u.id
                 JOIN request_categories c ON r.category_id = c.id
                 JOIN rooms rm ON r.room_id = rm.id
                 JOIN buildings b ON rm.building_id = b.id
        ORDER BY r.created_at DESC
    `, (err, requests) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(requests);
    });
});

app.get('/api/requests/user/:userId', (req, res) => {
    const { userId } = req.params;

    db.all(`
        SELECT r.*, c.name as category_name, rm.room_number, b.name as building_name
        FROM requests r
                 JOIN request_categories c ON r.category_id = c.id
                 JOIN rooms rm ON r.room_id = rm.id
                 JOIN buildings b ON rm.building_id = b.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    `, [userId], (err, requests) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(requests);
    });
});

app.post('/api/requests', (req, res) => {
    const { user_id, category_id, description, room_id } = req.body;

    db.run(`
        INSERT INTO requests (user_id, category_id, description, room_id, status)
        VALUES (?, ?, ?, ?, 'pending')
    `, [user_id, category_id, description, room_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, requestId: this.lastID });
    });
});
app.put('/api/requests/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, admin_comment } = req.body;

    db.run(`
        UPDATE requests
        SET status = ?, updated_at = CURRENT_TIMESTAMP, admin_comment = ?
        WHERE id = ?
    `, [status, admin_comment, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер на http://localhost:${PORT}`);
});