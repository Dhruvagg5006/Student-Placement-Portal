import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowUpRight, Building2, Check, ChevronDown, CircleHelp, Filter,
  LayoutDashboard, LoaderCircle, Mail, Menu, MoreHorizontal, Pencil, Plus, Search,
  SlidersHorizontal, Sparkles, Target, Trash2, TrendingUp, Users, X,
} from 'lucide-react';
import { api } from './api.js';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const EMPTY_FORM = { name: '', email: '', phone: '', company: '', source: '', status: 'New' };

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

function formatDate(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleDateString('en', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><i />{status}</span>;
}

function LeadForm({ lead, onClose, onSave }) {
  const [values, setValues] = useState(lead || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    ['name', 'email', 'phone', 'company', 'source'].forEach((field) => {
      if (!values[field].trim()) nextErrors[field] = 'This field is required.';
    });
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (values.phone && !/^[+]?[\d\s().-]{7,20}$/.test(values.phone)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave(values);
    } catch (error) {
      setErrors({ ...error.fields, form: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{lead ? 'KEEP THE DETAILS CURRENT' : 'GROW YOUR PIPELINE'}</span>
            <h2 id="modal-title">{lead ? 'Edit lead' : 'Add a new lead'}</h2>
            <p>{lead ? 'Update contact details or move this lead forward.' : 'Add a contact and start building a relationship.'}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </div>
        <form onSubmit={submit} noValidate>
          {errors.form && <div className="form-alert">{errors.form}</div>}
          <div className="form-grid">
            <label className="field full">
              <span>Full name <b>*</b></span>
              <input autoFocus name="name" value={values.name} onChange={change} placeholder="e.g. Alex Morgan" maxLength="120" />
              {errors.name && <small>{errors.name}</small>}
            </label>
            <label className="field">
              <span>Email address <b>*</b></span>
              <input type="email" name="email" value={values.email} onChange={change} placeholder="alex@company.com" maxLength="120" />
              {errors.email && <small>{errors.email}</small>}
            </label>
            <label className="field">
              <span>Phone number <b>*</b></span>
              <input type="tel" name="phone" value={values.phone} onChange={change} placeholder="+1 (555) 000-0000" maxLength="120" />
              {errors.phone && <small>{errors.phone}</small>}
            </label>
            <label className="field full">
              <span>Company <b>*</b></span>
              <input name="company" value={values.company} onChange={change} placeholder="Company name" maxLength="120" />
              {errors.company && <small>{errors.company}</small>}
            </label>
            <label className="field">
              <span>Lead source <b>*</b></span>
              <select name="source" value={values.source} onChange={change}>
                <option value="" disabled>Select a source</option>
                {SOURCES.map((source) => <option key={source}>{source}</option>)}
              </select>
              {errors.source && <small>{errors.source}</small>}
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" value={values.status} onChange={change}>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <div className="modal-footer">
            <span><b>*</b> Required fields</span>
            <div className="button-row">
              <button type="button" className="button button-muted" onClick={onClose}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                {saving ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: Object.fromEntries(STATUSES.map((status) => [status, 0])) });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortBy, setSortBy] = useState('recent');
  const [modalLead, setModalLead] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [leadData, statsData] = await Promise.all([
        api.getLeads({
          search,
          status: statusFilter === 'All statuses' ? '' : statusFilter,
          sort: sortBy === 'name' ? 'name' : 'created',
          direction: sortBy === 'name' ? 'asc' : 'desc',
        }),
        api.getStats(),
      ]);
      setLeads(leadData);
      setStats(statsData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const progress = useMemo(() => stats.total ? Math.round((stats.byStatus.Qualified / stats.total) * 100) : 0, [stats]);

  async function saveLead(values) {
    if (modalLead) await api.updateLead(modalLead.id, values);
    else await api.createLead(values);
    setShowForm(false);
    setModalLead(null);
    setNotice(modalLead ? 'Lead details updated.' : 'Lead added to your pipeline.');
    await refresh();
  }

  async function deleteLead(lead) {
    if (!window.confirm(`Delete ${lead.name} from your leads? This action cannot be undone.`)) return;
    try {
      await api.deleteLead(lead.id);
      setNotice(`${lead.name} was deleted.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function editLead(lead) {
    setModalLead(lead);
    setShowForm(true);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" aria-label="Leadflow home">
          <div className="brand-mark"><Target size={21} strokeWidth={2.3} /></div>
          <span>leadflow<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switch">
          <div className="workspace-avatar">M</div>
          <div className="workspace-copy"><strong>Meru workspace</strong><span>Free plan</span></div>
          <ChevronDown size={16} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav className="side-nav">
          <a href="#overview" className="nav-item"><LayoutDashboard size={17} /> Overview</a>
          <a href="#leads" className="nav-item active"><Users size={17} /> Leads <span className="nav-count">{stats.total}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Sparkles size={16} /></span>
            <strong>Keep momentum</strong>
            <p>Every great customer relationship starts with a conversation.</p>
            <a href="#leads">View your leads <ArrowUpRight size={14} /></a>
          </div>
          <button className="profile-button">
            <span className="profile-avatar">JD</span>
            <span className="profile-copy"><strong>Jamie Doe</strong><small>Sales manager</small></span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Leads</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-avatar">JD</span>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <span className="eyebrow"><span className="live-dot" /> YOUR SALES PIPELINE</span>
              <h1>Leads<span className="heading-period">.</span></h1>
              <p>Build meaningful connections. Keep every opportunity moving.</p>
            </div>
            <button className="button button-primary add-button" onClick={() => { setModalLead(null); setShowForm(true); }}>
              <Plus size={17} strokeWidth={2.3} /> Add lead
            </button>
          </section>

          <section className="stats-grid" aria-label="Lead overview">
            <article className="stat-card stat-total">
              <div className="stat-top"><span className="stat-icon"><Users size={18} /></span><span className="stat-caption">ALL TIME</span></div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total leads <span>in your pipeline</span></div>
              <div className="stat-decoration"><Users size={84} /></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-blue"><Sparkles size={18} /></span><span className="stat-caption">INCOMING</span></div>
              <div className="stat-value">{stats.byStatus.New}</div>
              <div className="stat-label">New leads <span>ready for a hello</span></div>
              <div className="mini-bar"><i style={{ width: `${stats.total ? Math.max(10, (stats.byStatus.New / stats.total) * 100) : 0}%` }} /></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-green"><TrendingUp size={18} /></span><span className="stat-caption">CONVERTED</span></div>
              <div className="stat-value">{stats.byStatus.Qualified}</div>
              <div className="stat-label">Qualified <span>{progress}% of total leads</span></div>
              <div className="mini-bar mini-bar-green"><i style={{ width: `${progress}%` }} /></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon stat-icon-purple"><Building2 size={18} /></span><span className="stat-caption">IN PROGRESS</span></div>
              <div className="stat-value">{stats.byStatus.Contacted}</div>
              <div className="stat-label">Contacted <span>conversations started</span></div>
              <div className="mini-bar mini-bar-purple"><i style={{ width: `${stats.total ? Math.max(10, (stats.byStatus.Contacted / stats.total) * 100) : 0}%` }} /></div>
            </article>
          </section>

          <section className="leads-panel" id="leads">
            <div className="panel-heading">
              <div><h2>All leads <span>{leads.length}</span></h2><p>A clear view of every relationship in progress.</p></div>
              <div className="panel-key"><span className="key-dot" /> Live pipeline</div>
            </div>
            <div className="toolbar">
              <label className="search-box">
                <Search size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads, companies..." aria-label="Search leads" />
                {search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
                <kbd>⌘ K</kbd>
              </label>
              <div className="toolbar-controls">
                <label className="select-control"><Filter size={15} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label>
                <label className="select-control sort-control"><ArrowDownUp size={15} /><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort leads"><option value="recent">Most recent</option><option value="name">Name A–Z</option></select><ChevronDown size={14} /></label>
              </div>
            </div>

            {error && <div className="error-banner" role="alert"><CircleHelp size={17} /><span>{error}</span><button onClick={refresh}>Try again</button></div>}
            <div className="table-scroll">
              <table>
                <thead><tr><th>LEAD</th><th>COMPANY</th><th>SOURCE</th><th>STATUS</th><th>ADDED</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6"><div className="table-state"><LoaderCircle className="spin" size={22} />Loading your leads…</div></td></tr>
                  ) : leads.length ? leads.map((lead, index) => (
                    <tr key={lead.id}>
                      <td><div className="lead-person"><span className={`lead-avatar avatar-${index % 5}`}>{initials(lead.name)}</span><span className="lead-info"><strong>{lead.name}</strong><small><Mail size={12} />{lead.email}</small></span></div></td>
                      <td><span className="company-name">{lead.company}</span><small className="phone-number">{lead.phone}</small></td>
                      <td><span className="source-value"><span className="source-mark">{lead.source === 'Referral' ? '↗' : lead.source === 'LinkedIn' ? 'in' : lead.source === 'Website' ? '◎' : lead.source === 'Event' ? '✳' : lead.source === 'Cold Call' ? '◉' : '·'}</span>{lead.source}</span></td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td><span className="date-value">{formatDate(lead.createdAt)}</span></td>
                      <td><div className="row-actions"><button onClick={() => editLead(lead)} aria-label={`Edit ${lead.name}`} title="Edit lead"><Pencil size={15} /></button><button onClick={() => deleteLead(lead)} aria-label={`Delete ${lead.name}`} title="Delete lead"><Trash2 size={15} /></button></div></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6"><div className="empty-state"><span className="empty-icon"><SlidersHorizontal size={21} /></span><strong>{search || statusFilter !== 'All statuses' ? 'No matching leads' : 'Your pipeline is a blank canvas'}</strong><p>{search || statusFilter !== 'All statuses' ? 'Try another search or filter.' : 'Add your first lead and make that next connection count.'}</p>{!search && statusFilter === 'All statuses' && <button className="button button-primary" onClick={() => { setModalLead(null); setShowForm(true); }}><Plus size={16} /> Add your first lead</button>}</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Showing <strong>{leads.length}</strong> {leads.length === 1 ? 'lead' : 'leads'}</span><span><span className="footer-dot" /> All changes saved</span></footer>
          </section>
          <footer className="page-footer"><span>Made for better conversations <span>♥</span></span><span>LEADFLOW <b>·</b> MERU TECHNOSOFT</span></footer>
        </div>
      </main>
      {showForm && <LeadForm lead={modalLead} onClose={() => { setShowForm(false); setModalLead(null); }} onSave={saveLead} />}
      {notice && <div className="toast"><span><Check size={15} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

export default App;
