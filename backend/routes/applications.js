const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply for a drive
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can apply.' });

    const { drive_id } = req.body;
    if (!drive_id) return res.status(400).json({ error: 'Drive ID is required.' });

    const pool = req.app.get('db');

    // Check drive exists and is open
    const drive = await pool.query('SELECT * FROM placement_drives WHERE id = $1 AND status = $2', [drive_id, 'open']);
    if (drive.rows.length === 0) return res.status(404).json({ error: 'Drive not found or closed.' });

    // Check duplicate
    const existing = await pool.query('SELECT id FROM applications WHERE student_id = $1 AND drive_id = $2', [req.user.id, drive_id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Already applied to this drive.' });

    const result = await pool.query(
      'INSERT INTO applications (student_id, drive_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, drive_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get my applications
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const pool = req.app.get('db');
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at, 
              p.company_name, p.job_role, p.package, p.location
       FROM applications a
       JOIN placement_drives p ON a.drive_id = p.id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('My applications error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

