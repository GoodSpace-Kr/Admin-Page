import React from 'react';
import { useNavigate } from 'react-router-dom';

const Main: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('refreshToken');
    // 로그아웃 상태 변경 이벤트 발생
    window.dispatchEvent(new Event('loginStatusChanged'));
    window.location.reload();
  };

  const handleClientManagement = () => {
    navigate('/clients');
  };

  const handleClientCreate = () => {
    navigate('/client/create');
  };

  const handleQuestionManagement = () => {
    navigate('/questions');
  };

  const handleQuestionCreate = () => {
    navigate('/question/create');
  };

  return (
    <div style={{ maxWidth: 600, margin: '100px auto', padding: 32, border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
      <h1>GoodSpace 관리자 메인</h1>
      <p>환영합니다! 🎉</p>
      
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button 
          onClick={handleClientManagement}
          style={{ 
            padding: '15px 30px', 
            background: '#1976d2', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
        >
          👥 클라이언트 관리
        </button>
        
        <button 
          onClick={handleClientCreate}
          style={{ 
            padding: '15px 30px', 
            background: '#28a745', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
        >
          ➕ 클라이언트 생성
        </button>
        
        <button 
          onClick={handleQuestionManagement}
          style={{ 
            padding: '15px 30px', 
            background: '#ff9800', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f57c00'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
        >
          💬 고객 문의 관리
        </button>
        
        <button 
          onClick={handleQuestionCreate}
          style={{ 
            padding: '15px 30px', 
            background: '#9c27b0', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7b1fa2'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9c27b0'}
        >
          ✏️ 문의 생성 (테스트용)
        </button>
        
        <button 
          onClick={handleLogout} 
          style={{ 
            padding: '10px 24px', 
            background: '#666', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4, 
            fontWeight: 'bold', 
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default Main; 