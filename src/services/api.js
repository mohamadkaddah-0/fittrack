const API_BASE = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('fittrack_token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const api = {
  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json()),
    
  register: (userData) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(res => res.json()),
    
  forgotPassword: (email) =>
    fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(res => res.json()),
    
  resetPassword: (email, code, newPassword) =>
    fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    }).then(res => res.json()),
    
  // User
  getCurrentUser: () =>
    fetch(`${API_BASE}/users/me`, { headers: headers() }).then(res => res.json()),
    
  updateUser: (data) =>
    fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    
  // Survey
  getSurvey: () =>
    fetch(`${API_BASE}/survey`, { headers: headers() }).then(res => res.json()),
    
  saveSurvey: (data) =>
    fetch(`${API_BASE}/survey`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(res => res.json())
};

export default api;