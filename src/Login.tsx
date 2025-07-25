import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

// axios 인스턴스 및 interceptor 관련 코드는 src/api.ts로 이동

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        '/authorization/sign-in',
        {
          email,
          password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      console.log('로그인 응답:', res);
      const token = res.data.accessToken;
      const refreshToken = res.data.refreshToken;
      if (token && refreshToken) {
        localStorage.setItem('jwt', token);
        localStorage.setItem('refreshToken', refreshToken);
        // 로그인 상태 변경 이벤트 발생
        window.dispatchEvent(new Event('loginStatusChanged'));
        navigate('/');
      } else {
        setError('토큰을 받지 못했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center' }}>관리자 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            autoComplete="username"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold' }} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default Login; 