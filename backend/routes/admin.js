const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Add new placement drive
router.post('/drives', authenticateAdmin, async (req, res) => {
  try {
    const { company_name, job_role, package: pkg, location, eligibility, deadline, description } = req.body;
    if (!company_name || !job_role || !pkg || !location || !eligibility || !deadline) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const pool = req.app.get('db');
    const result = await pool.query(
      `INSERT INTO placement_drives (company_name, job_role, package, location, eligibility, deadline, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [company_name, job_role, pkg, location, eligibility, deadline, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add drive error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all drives (including closed)
router.get('/drives', authenticateAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT * FROM placement_drives ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete / close a drive
router.delete('/drives/:id', authenticateAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      "UPDATE placement_drives SET status = 'closed' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Drive not found.' });
    res.json({ message: 'Drive closed successfully.', drive: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all students
router.get('/students', authenticateAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query('SELECT id, name, email, department, year, cgpa, phone, created_at FROM students ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all applications
router.get('/applications', authenticateAdmin, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at,
              s.name AS student_name, s.email AS student_email, s.department,
              p.company_name, p.job_role
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN placement_drives p ON a.drive_id = p.id
       ORDER BY a.applied_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update application status
router.patch('/applications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Applied', 'Shortlisted', 'Rejected', 'Selected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: Applied, Shortlisted, Rejected, or Selected.' });
    }

    const pool = req.app.get('db');
    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

