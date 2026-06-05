const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod';

function generateToken(user) {
    const payload = { id: user.id, role: user.role };
    return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    console.log('requireAuth called for', req.method, req.url, 'auth header present:', !!auth);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });

    try {
        const payload = jwt.verify(parts[1], SECRET);
        req.auth = payload;
        next();
    } catch (err) {
        console.error('JWT verify error', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { generateToken, requireAuth };
