import axios from 'axios';
import { handleTokenRefresh } from './tokenRefresh';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// 요청 시 accessToken 자동 첨부
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 응답에서 accessToken 만료(401) 시 자동 재발급
api.interceptors.response.use(
  res => res,
  (error: any) => handleTokenRefresh(error, api)
);

export default api; 