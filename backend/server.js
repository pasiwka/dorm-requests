const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');
const { generateToken, requireAuth } = require('./auth');

const app = express();
const PORT = 3000;

console.log('__filename', __filename);
console.log('process.cwd()', process.cwd());

app.use(cors());
app.use(express.json());

// test route to validate auth middleware
app.get('/__test_auth', requireAuth, (req, res) => {
    res.json({ ok: true, auth: req.auth });
});

app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;

    db.get(`SELECT * FROM users WHERE phone = ?`, [phone], (err, user) => {
        if (err) {
            console.error('DB error on login:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

        const stored = user.password || '';
        let passwordMatch = false;

        try {
            if (stored.startsWith('$2')) {
                passwordMatch = bcrypt.compareSync(password, stored);
            } else {
                // legacy plain-text password: migrate to bcrypt on successful match
                passwordMatch = password === stored;
                if (passwordMatch) {
                    try {
                        const newHash = bcrypt.hashSync(password, 10);
                        db.run(`UPDATE users SET password = ? WHERE id = ?`, [newHash, user.id], (updErr) => {
                            if (updErr) console.error('Failed to migrate password hash:', updErr);
                        });
                    } catch (hErr) {
                        console.error('Hashing error during migration:', hErr);
                    }
                }
            }
        } catch (cmpErr) {
            console.error('Password compare error:', cmpErr);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!passwordMatch) return res.status(401).json({ error: 'Неверный пароль' });

        const token = generateToken(user);

        res.json({
            success: true,
            token,
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
app.get('/api/users/:userId', requireAuth, (req, res) => {
    const { userId } = req.params;

    // allow admin or the user himself
    if (req.auth.role !== 'admin' && String(req.auth.id) !== String(userId)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

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
app.put('/api/residencies/:userId', requireAuth, (req, res) => {
    const { userId } = req.params;
    const { room_id, is_current } = req.body;

    // permission: admin or the user himself
    if (req.auth.role !== 'admin' && String(req.auth.id) !== String(userId)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    db.run(`UPDATE residencies SET is_current = 0 WHERE user_id = ?`, [userId], function(err) {
        if (err) {
            console.error('Ошибка сброса residencies:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        db.run(`
            INSERT INTO residencies (user_id, room_id, is_current, moved_in)
            VALUES (?, ?, ?, date('now'))
        `, [userId, room_id, is_current ? 1 : 0], function(err2) {
            if (err2) {
                console.error('Ошибка вставки residencies:', err2);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ success: true });
        });
    });
});

app.get('/api/requests', requireAuth, (req, res) => {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
    db.all(`
        SELECT r.*, u.first_name, u.last_name, c.name as category_name, rm.room_number, b.name as building_name
        FROM requests r
                 JOIN users u ON r.user_id = u.id
                 JOIN request_categories c ON r.category_id = c.id
                 JOIN rooms rm ON r.room_id = rm.id
                 JOIN buildings b ON rm.building_id = b.id
        ORDER BY r.created_at DESC
    `, (err, requests) => {
        if (err) {
            console.error('Ошибка загрузки заявок:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(requests);
    });
});

app.get('/api/requests/user/:userId', requireAuth, (req, res) => {
    const { userId } = req.params;
    if (req.auth.role !== 'admin' && String(req.auth.id) !== String(userId)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    db.all(`
        SELECT r.*, c.name as category_name, rm.room_number, b.name as building_name
        FROM requests r
                 JOIN request_categories c ON r.category_id = c.id
                 JOIN rooms rm ON r.room_id = rm.id
                 JOIN buildings b ON rm.building_id = b.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    `, [userId], (err, requests) => {
        if (err) {
            console.error('Ошибка загрузки заявок пользователя:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(requests);
    });
});

app.post('/api/requests', requireAuth, (req, res) => {
    const { user_id, category_id, description, room_id } = req.body;
    if (req.auth.role !== 'admin' && String(req.auth.id) !== String(user_id)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    db.run(`
        INSERT INTO requests (user_id, category_id, description, room_id, status)
        VALUES (?, ?, ?, ?, 'pending')
    `, [user_id, category_id, description, room_id], function(err) {
        if (err) {
            console.error('Ошибка вставки заявки:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ success: true, requestId: this.lastID });
    });
});

app.put('/api/requests/:id/status', requireAuth, (req, res) => {
    const { id } = req.params;
    const { status, admin_comment } = req.body;
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });

    db.run(`
        UPDATE requests
        SET status = ?, updated_at = CURRENT_TIMESTAMP, admin_comment = ?
        WHERE id = ?
    `, [status, admin_comment, id], function(err) {
        if (err) {
            console.error('Ошибка обновления статуса:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер на http://localhost:${PORT}`);
});
// protect user update route
app.put('/api/users/:userId', requireAuth, (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name } = req.body;

    if (req.auth.role !== 'admin' && String(req.auth.id) !== String(userId)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }

    db.run(`
        UPDATE users
        SET first_name = ?, last_name = ?
        WHERE id = ?
    `, [first_name, last_name, userId], function(err) {
        if (err) {
            console.error('Ошибка обновления:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ success: true, message: 'Данные обновлены' });
    });
});