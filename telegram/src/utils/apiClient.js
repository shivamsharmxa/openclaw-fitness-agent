import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const api = axios.create({
  baseURL: process.env.API_BASE_URL ?? 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
  },
});

export async function chatWithAgent(userId, message) {
  const { data } = await api.post('/api/telegram/chat', { userId, message });
  return data;
}

export async function getUserByTelegramId(telegramId) {
  try {
    const { data } = await api.get(`/api/telegram/user/${telegramId}`);
    return data.user;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

export async function getProgress(userId) {
  const { data } = await api.get(`/api/telegram/progress/${userId}`);
  return data;
}

export async function getCurrentPlan(userId) {
  const { data } = await api.get(`/api/telegram/plan/${userId}`);
  return data;
}
