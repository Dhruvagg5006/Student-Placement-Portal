import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function DrivesView() {
  const [drives, setDrives] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const { authFetch } = useAuth();

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const url = search ? `/api/drives?search=${encodeURIComponent(search)}` : '/api/drives';
      const res = await authFetch(url);
      const data = await res.json();
      setDrives(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrives(); }, [search]);

  const applyForDrive = async (driveId) => {
    setMsg('');
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ drive_id: driveId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Application submitted successfully!');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Placement Drives</h2>
        <div className="search-bar">
          <input
            type="text" placeholder="Search by company, role or location..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
      {loading ? <div className="loading">Loading drives...</div> : (
        <div className="drives-grid">
          {drives.length === 0 ? <p className="empty-msg">No placement drives found.</p> :
            drives.map(drive => (
              <div key={drive.id} className="drive-card">
                <div className="drive-card-header">
                  <h3>{drive.company_name}</h3>
                  <span className="badge badge-open">Open</span>
                </div>
                <p className="drive-role">{drive.job_role}</p>
                <div className="drive-details">
                  <div><span className="label">Package:</span> {drive.package}</div>
                  <div><span className="label">Location:</span> {drive.location}</div>
                  <div><span className="label">Eligibility:</span> {drive.eligibility}</div>
                  <div><span className="label">Deadline:</span> {new Date(drive.deadline).toLocaleDateString()}</div>
                </div>
                {drive.description && <p className="drive-desc">{drive.description}</p>}
                <button className="btn btn-primary" onClick={() => applyForDrive(drive.id)}>Apply Now</button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/applications/my');
        setApps(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const statusClass = (s) => {
    const map = { Applied: 'badge-applied', Shortlisted: 'badge-shortlisted', Selected: 'badge-selected', Rejected: 'badge-rejected' };
    return map[s] || '';
  };

  return (
    <div>
      <div className="page-header"><h2>My Applications</h2></div>
      {loading ? <div className="loading">Loading...</div> : apps.length === 0 ? <p className="empty-msg">No applications yet.</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Company</th><th>Role</th><th>Package</th><th>Location</th><th>Status</th><th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr key={app.id}>
                  <td>{app.company_name}</td>
                  <td>{app.job_role}</td>
                  <td>{app.package}</td>
                  <td>{app.location}</td>
                  <td><span className={`badge ${statusClass(app.status)}`}>{app.status}</span></td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProfileView() {
  const { user } = useAuth();
  return (
    <div>
      <div className="page-header"><h2>My Profile</h2></div>
      <div className="profile-card">
        <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
}

function OverviewView() {
  const [drives, setDrives] = useState([]);
  const [apps, setApps] = useState([]);
  const { authFetch, user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const [dRes, aRes] = await Promise.all([authFetch('/api/drives'), authFetch('/api/applications/my')]);
        setDrives(await dRes.json());
        setApps(await aRes.json());
      } catch (err) { console.error(err); }
    })();
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Welcome, {user.name}!</h2></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{drives.length}</div><div className="stat-label">Open Drives</div></div>
        <div className="stat-card stat-blue"><div className="stat-number">{apps.length}</div><div className="stat-label">My Applications</div></div>
        <div className="stat-card stat-green"><div className="stat-number">{apps.filter(a => a.status === 'Selected').length}</div><div className="stat-label">Selected</div></div>
        <div className="stat-card stat-yellow"><div className="stat-number">{apps.filter(a => a.status === 'Shortlisted').length}</div><div className="stat-label">Shortlisted</div></div>
      </div>
      <div className="page-header"><h3>Recent Applications</h3></div>
      {apps.length === 0 ? <p className="empty-msg">No applications yet. Browse drives to get started!</p> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Company</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {apps.slice(0, 5).map(a => (
                <tr key={a.id}><td>{a.company_name}</td><td>{a.job_role}</td><td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/drives', label: 'Placement Drives', icon: '💼' },
    { path: '/dashboard/applications', label: 'My Applications', icon: '📋' },
    { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="layout">
      <Sidebar title="Student Portal" user={user} links={links} currentPath={location.pathname} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route index element={<OverviewView />} />
          <Route path="drives" element={<DrivesView />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile" element={<ProfileView />} />
        </Routes>
      </main>
    </div>
  );
}

