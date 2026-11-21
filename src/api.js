async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Something went wrong. Please try again.');
    error.fields = payload.fields || {};
    throw error;
  }
  return payload;
}

export const api = {
  getLeads: (params) => request(`/api/leads?${new URLSearchParams(params)}`),
  getStats: () => request('/api/stats'),
  createLead: (lead) => request('/api/leads', { method: 'POST', body: JSON.stringify(lead) }),
  updateLead: (id, lead) => request(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(lead) }),
  deleteLead: (id) => request(`/api/leads/${id}`, { method: 'DELETE' }),
};
