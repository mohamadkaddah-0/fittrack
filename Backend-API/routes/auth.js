const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, gender, age, weight, height, activity, goal, experience } = req.body;
        
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            `INSERT INTO users (name, email, password, gender, age, weight, height, activity_level, goal, experience_level) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, gender, age, weight, height, activity, goal, experience]
        );
        
        res.status(201).json({ success: true, message: 'User registered successfully', userId: result.insertId });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                age: user.age,
                weight: user.weight,
                height: user.height
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const [users] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with this email address. Please register first.' });
        }
        
        const userId = users[0].id;
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await db.execute('DELETE FROM password_resets WHERE user_id = ?', [userId]);
        
        await db.execute(
            `INSERT INTO password_resets (user_id, code, expires_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
            [userId, resetCode]
        );
        
        console.log(`Reset code for ${email}: ${resetCode}`);
        
        res.json({
            success: true,
            message: 'Reset code sent to your email',
            devCode: resetCode
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/verify-reset-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code are required' });
        }
        
        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }
        
        const userId = users[0].id;
        
        const [resets] = await db.execute(
            `SELECT * FROM password_resets 
             WHERE user_id = ? AND code = ? AND expires_at > NOW() 
             ORDER BY created_at DESC LIMIT 1`,
            [userId, code]
        );
        
        if (resets.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }
        
        res.json({ success: true, message: 'Code verified successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        if (newPassword.length < 3) {
            return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
        }
        
        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }
        
        const userId = users[0].id;
        
        const [resets] = await db.execute(
            `SELECT * FROM password_resets 
             WHERE user_id = ? AND code = ? AND expires_at > NOW() 
             ORDER BY created_at DESC LIMIT 1`,
            [userId, code]
        );
        
        if (resets.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        
        await db.execute('DELETE FROM password_resets WHERE user_id = ?', [userId]);
        
        res.json({ success: true, message: 'Password reset successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Email not found' });
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.execute('DELETE FROM password_resets WHERE user_id = ?', [users[0].id]);
    await db.execute('INSERT INTO password_resets (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))', [users[0].id, code]);
    
    console.log(`Reset code for ${email}: ${code}`);
    res.json({ success: true, devCode: code });
});

router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;
    
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ success: false, message: 'Invalid code' });
    
    const [resets] = await db.execute('SELECT * FROM password_resets WHERE user_id = ? AND code = ? AND expires_at > NOW()', [users[0].id, code]);
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    
    res.json({ success: true });
});

router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    
    if (newPassword.length < 3) {
        return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
    }
    
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ success: false, message: 'Invalid request' });
    
    const [resets] = await db.execute('SELECT * FROM password_resets WHERE user_id = ? AND code = ? AND expires_at > NOW()', [users[0].id, code]);
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);
    await db.execute('DELETE FROM password_resets WHERE user_id = ?', [users[0].id]);
    
    res.json({ success: true, message: 'Password reset successfully' });
});

module.exports = router;
