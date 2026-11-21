const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const authRoutes = require('./routes/auth');
const drivesRoutes = require('./routes/drives');
const applicationsRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 5000;

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'placement_user',
  password: process.env.DB_PASSWORD || 'placement_pass',
  database: process.env.DB_NAME || 'placement_db',
});

// Make pool available to routes
app.set('db', pool);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drives', drivesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Serve React production build
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

