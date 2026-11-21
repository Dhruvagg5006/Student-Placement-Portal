import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { LEAD_STATUSES, validateLead } from './validation.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', (_req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) AS count FROM leads GROUP BY status').all();
  const counts = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0]));
  for (const row of rows) counts[row.status] = row.count;
  res.json({ total: Object.values(counts).reduce((sum, count) => sum + count, 0), byStatus: counts });
});

app.get('/api/leads', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const sortBy = req.query.sort === 'name' ? 'name COLLATE NOCASE' : 'created_at';
  const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC';

  if (status && !LEAD_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status filter.' });
  }

  const conditions = [];
  const params = {};
  if (search) {
    conditions.push('(name LIKE @search OR company LIKE @search OR email LIKE @search)');
    params.search = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  }
  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const leads = db.prepare(`
    SELECT id, name, email, phone, company, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM leads ${where}
    ORDER BY ${sortBy} ${direction}, id DESC
  `).all(params);
  res.json(leads);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.prepare(`
    SELECT id, name, email, phone, company, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM leads WHERE id = ?
  `).get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json(lead);
});

app.post('/api/leads', (req, res) => {
  const { value, errors } = validateLead(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the form fields.', fields: errors });

  const result = db.prepare(`
    INSERT INTO leads (name, email, phone, company, source, status)
    VALUES (@name, @email, @phone, @company, @source, @status)
  `).run(value);
  const lead = db.prepare(`
    SELECT id, name, email, phone, company, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM leads WHERE id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(lead);
});

app.put('/api/leads/:id', (req, res) => {
  const { value, errors } = validateLead(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the form fields.', fields: errors });

  const result = db.prepare(`
    UPDATE leads SET name = @name, email = @email, phone = @phone, company = @company,
      source = @source, status = @status, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...value, id: req.params.id });
  if (!result.changes) return res.status(404).json({ error: 'Lead not found.' });
  const lead = db.prepare(`
    SELECT id, name, email, phone, company, source, status, created_at AS createdAt, updated_at AS updatedAt
    FROM leads WHERE id = ?
  `).get(req.params.id);
  res.json(lead);
});

app.delete('/api/leads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Lead not found.' });
  res.status(204).end();
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

const clientDist = path.resolve(here, '..', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

export default app;
