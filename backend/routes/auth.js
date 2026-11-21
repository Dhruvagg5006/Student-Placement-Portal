const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Student registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, year, cgpa, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const pool = req.app.get('db');
    const existing = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO students (name, email, password, department, year, cgpa, phone) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email',
      [name, email, hashedPassword, department || null, year || null, cgpa || null, phone || null]
    );

    const student = result.rows[0];
    const token = jwt.sign({ id: student.id, email: student.email, role: 'student' }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: student.id, name: student.name, email: student.email, role: 'student' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Student or Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const pool = req.app.get('db');
    let user, role;

    if (isAdmin) {
      const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
      user = result.rows[0];
      role = 'admin';
    } else {
      const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
      user = result.rows[0];
      role = 'student';
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

