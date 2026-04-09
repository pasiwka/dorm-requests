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