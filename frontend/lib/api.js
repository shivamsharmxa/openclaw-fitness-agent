import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Lazy getter — avoids circular import at module load time
function getAuthStore() {
  return import('../store/authStore').then((m) => m.useAuthStore);
}

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Keep Zustand in sync so useRequireAuth doesn't see a stale token
        const useAuthStore = await getAuthStore();
        useAuthStore.setState({ accessToken, refreshToken: newRefreshToken });

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        const useAuthStore = await getAuthStore();
        useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

// ── Users ─────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  setFitnessGoal: (data) => api.post('/users/me/fitness-goal', data),
  getFitnessGoal: () => api.get('/users/me/fitness-goal'),
  linkTelegram: (telegramId) => api.post('/users/me/link-telegram', { telegramId }),
  unlinkTelegram: () => api.delete('/users/me/link-telegram'),
};

// ── Chat ──────────────────────────────────────────────────────────
export const chatApi = {
  send: (message) => api.post('/chat', { message }),
  getHistory: (params) => api.get('/chat/history', { params }),
  clearHistory: () => api.delete('/chat/history'),
  sendStream: (message) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
  },
};

// ── Workouts ──────────────────────────────────────────────────────
export const workoutApi = {
  generatePlan: (prompt) => api.post('/workouts/generate', { prompt }),
  getCurrentPlan: () => api.get('/workouts/current'),
  getPlanById: (id) => api.get(`/workouts/${id}`),
  logWorkout: (data) => api.post('/workouts/logs', data),
  getLogs: (params) => api.get('/workouts/logs', { params }),
};

// ── Progress ──────────────────────────────────────────────────────
export const progressApi = {
  getSummary: (days) => api.get('/progress', { params: { days } }),
  getMetrics: (type, days) => api.get('/progress/metrics', { params: { type, days } }),
  logMetric: (data) => api.post('/progress/metrics', data),
};
