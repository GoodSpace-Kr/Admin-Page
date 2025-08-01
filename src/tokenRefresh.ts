import axios from 'axios';

export async function handleTokenRefresh(error: any, api: any) {
  const originalRequest = error.config as any;
  if (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    localStorage.getItem('refreshToken')
  ) {
    originalRequest._retry = true;
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const res = await axios.post<{ accessToken: string }>(
        `${process.env.REACT_APP_API_URL}/authorization/reissue`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newAccessToken = res.data.accessToken;
      if (newAccessToken) {
        localStorage.setItem('jwt', newAccessToken);
        // 기존 요청에 새 토큰을 넣어서 재시도
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    } catch (refreshError) {
      // 리프레시 토큰도 만료된 경우 로그아웃 처리 등
      localStorage.removeItem('jwt');
      localStorage.removeItem('refreshToken');
      window.location.reload();
    }
  }
  return Promise.reject(error);
} 