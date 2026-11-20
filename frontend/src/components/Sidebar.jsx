import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ title, user, links, currentPath, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🎓</span>
        <h2>{title}</h2>
      </div>
      <nav className="sidebar-nav">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${currentPath === link.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div className="sidebar-username">{user?.name}</div>
            <div className="sidebar-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}

