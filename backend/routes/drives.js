const express = require('express');
const router = express.Router();

// Get all open placement drives
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('db');
    const { search } = req.query;
    let query = 'SELECT * FROM placement_drives WHERE status = $1';
    let params = ['open'];

    if (search) {
      query += ' AND (LOWER(company_name) LIKE $2 OR LOWER(job_role) LIKE $2 OR LOWER(location) LIKE $2)';
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ' ORDER BY deadline ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get drives error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

