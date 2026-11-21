import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-manager-test-'));
const port = 3100 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
let server;

before(async () => {
  let serverOutput = '';
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DATABASE_PATH: path.join(tempDir, 'test.db') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.on('data', (chunk) => { serverOutput += chunk; });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Test API did not start. ${serverOutput.trim()}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => server.once('exit', resolve));
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function callApi(route, options) {
  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
}

const leadInput = {
  name: 'Taylor Morgan',
  email: 'taylor@example.com',
  phone: '+1 (415) 555-0123',
  company: 'Northstar Labs',
  source: 'Referral',
  status: 'New',
};

test('creates, searches, updates, counts, and deletes a lead', async () => {
  const create = await callApi('/api/leads', { method: 'POST', body: JSON.stringify(leadInput) });
  assert.equal(create.status, 201);
  const lead = await create.json();
  assert.equal(lead.name, leadInput.name);

  const search = await callApi('/api/leads?search=Northstar');
  assert.equal((await search.json()).length, 1);

  const update = await callApi(`/api/leads/${lead.id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...leadInput, status: 'Qualified' }),
  });
  assert.equal((await update.json()).status, 'Qualified');
  const stats = await (await callApi('/api/stats')).json();
  assert.equal(stats.total, 1);
  assert.equal(stats.byStatus.Qualified, 1);

  const remove = await callApi(`/api/leads/${lead.id}`, { method: 'DELETE' });
  assert.equal(remove.status, 204);
  const missing = await callApi(`/api/leads/${lead.id}`);
  assert.equal(missing.status, 404);
});

test('rejects invalid input with field-level validation errors', async () => {
  const response = await callApi('/api/leads', {
    method: 'POST',
    body: JSON.stringify({ ...leadInput, email: 'not-an-email', source: 'Unknown' }),
  });
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.ok(payload.fields.email);
  assert.ok(payload.fields.source);
});
