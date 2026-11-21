import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function AdminOverview() {
  const [stats, setStats] = useState({ drives: 0, students: 0, applications: 0 });
  const { authFetch } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const [dRes, sRes, aRes] = await Promise.all([
          authFetch('/api/admin/drives'),
          authFetch('/api/admin/students'),
          authFetch('/api/admin/applications')
        ]);
        const drives = await dRes.json();
        const students = await sRes.json();
        const applications = await aRes.json();
        setStats({ drives: drives.length, students: students.length, applications: applications.length });
      } catch (err) { console.error(err); }
    })();
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Admin Dashboard</h2></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{stats.drives}</div><div className="stat-label">Total Drives</div></div>
        <div className="stat-card stat-blue"><div className="stat-number">{stats.students}</div><div className="stat-label">Registered Students</div></div>
        <div className="stat-card stat-green"><div className="stat-number">{stats.applications}</div><div className="stat-label">Total Applications</div></div>
      </div>
    </div>
  );
}

function ManageDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', job_role: '', package: '', location: '', eligibility: '', deadline: '', description: '' });
  const [msg, setMsg] = useState('');
  const { authFetch } = useAuth();

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/drives');
      setDrives(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrives(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await authFetch('/api/admin/drives', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Drive added successfully!');
      setForm({ company_name: '', job_role: '', package: '', location: '', eligibility: '', deadline: '', description: '' });
      setShowForm(false);
      fetchDrives();
    } catch (err) { setMsg(err.message); }
  };

  const closeDrive = async (id) => {
    try {
      await authFetch(`/api/admin/drives/${id}`, { method: 'DELETE' });
      fetchDrives();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Manage Drives</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Drive'}
        </button>
      </div>
      {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
      {showForm && (
        <div className="form-card">
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Job Role *</label>
                <input value={form.job_role} onChange={e => setForm({ ...form, job_role: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Package *</label>
                <input value={form.package} onChange={e => setForm({ ...form, package: e.target.value })} placeholder="e.g. 10 LPA" required />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Eligibility *</label>
                <input value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Deadline *</label>
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" />
            </div>
            <button type="submit" className="btn btn-primary">Add Drive</button>
          </form>
        </div>
      )}
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Company</th><th>Role</th><th>Package</th><th>Deadline</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {drives.map(d => (
                <tr key={d.id}>
                  <td>{d.company_name}</td>
                  <td>{d.job_role}</td>
                  <td>{d.package}</td>
                  <td>{new Date(d.deadline).toLocaleDateString()}</td>
                  <td><span className={`badge ${d.status === 'open' ? 'badge-open' : 'badge-closed'}`}>{d.status}</span></td>
                  <td>
                    {d.status === 'open' && <button className="btn btn-danger btn-sm" onClick={() => closeDrive(d.id)}>Close</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ViewStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/admin/students');
        setStudents(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Registered Students</h2></div>
      {loading ? <div className="loading">Loading...</div> : students.length === 0 ? <p className="empty-msg">No students registered yet.</p> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>CGPA</th><th>Phone</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td><td>{s.email}</td><td>{s.department || '-'}</td>
                  <td>{s.year || '-'}</td><td>{s.cgpa || '-'}</td><td>{s.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ManageApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/applications');
      setApps(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await authFetch(`/api/admin/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      fetchApps();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header"><h2>All Applications</h2></div>
      {loading ? <div className="loading">Loading...</div> : apps.length === 0 ? <p className="empty-msg">No applications yet.</p> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Student</th><th>Email</th><th>Company</th><th>Role</th><th>Status</th><th>Update Status</th></tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td>{a.student_name}</td>
                  <td>{a.student_email}</td>
                  <td>{a.company_name}</td>
                  <td>{a.job_role}</td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td>
                    <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} className="status-select">
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/drives', label: 'Manage Drives', icon: '💼' },
    { path: '/admin/students', label: 'Students', icon: '🎓' },
    { path: '/admin/applications', label: 'Applications', icon: '📋' },
  ];

  return (
    <div className="layout">
      <Sidebar title="Admin Portal" user={user} links={links} currentPath={location.pathname} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="drives" element={<ManageDrives />} />
          <Route path="students" element={<ViewStudents />} />
          <Route path="applications" element={<ManageApplications />} />
        </Routes>
      </main>
    </div>
  );
}

