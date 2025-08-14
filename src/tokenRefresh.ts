import axios from 'axios';

export async function handleTokenRefresh(error: any, api: any) {
  const originalRequest = error.config as any;
  
  // 401/403 에러가 발생했는데 refreshToken이 없는 경우 로그인 페이지로 리다이렉트
  if ((error.response?.status === 401 || error.response?.status === 403) && !localStorage.getItem('refreshToken')) {
    localStorage.removeItem('jwt');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return Promise.reject(error);
  }
  
  if (
    (error.response?.status === 401 || error.response?.status === 403) &&
    !originalRequest._retry &&
    localStorage.getItem('refreshToken')
  ) {
    // 403 에러 발생 시 콘솔에 로그 남기기
    if (error.response?.status === 403) {
      console.log('403 에러 발생: 토큰 재발급 시도');
    }
    
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
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
} 