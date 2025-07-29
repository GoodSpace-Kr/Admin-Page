import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

interface ClientInfoDto {
  id: number;
  name: string;
  profileImageUrl: string; // 서버에서 받을 때는 URL
  backgroundImageUrl: string; // 서버에서 받을 때는 URL
  introduction: string;
  clientType: string;
  status: 'PRIVATE' | 'PUBLIC';
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get<ClientInfoDto[]>('/admin/client');
      console.log('API 응답:', response.data);
      setClients(response.data);
    } catch (err: any) {
      setError('클라이언트 목록을 불러오는데 실패했습니다.');
      console.error('클라이언트 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleClientCreate = () => {
    navigate('/client/create');
  };

  const getClientTypeBadge = (clientType: string) => {
    const typeColors: { [key: string]: { bg: string; color: string; text: string } } = {
      'INDIVIDUAL': { bg: '#e3f2fd', color: '#1976d2', text: '개인' },
      'COMPANY': { bg: '#f3e5f5', color: '#7b1fa2', text: '기업' },
      'ORGANIZATION': { bg: '#e8f5e8', color: '#2e7d32', text: '단체' },
      'CREATOR': { bg: '#fff3e0', color: '#f57c00', text: '크리에이터' },
      'INFLUENCER': { bg: '#fce4ec', color: '#c2185b', text: '인플루언서' }
    };

    const style = typeColors[clientType] || { bg: '#f5f5f5', color: '#666', text: clientType };

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const getStatusBadge = (status: 'PRIVATE' | 'PUBLIC') => {
    const statusColors = {
      'PRIVATE': { bg: '#ffebee', color: '#c62828', text: '비공개' },
      'PUBLIC': { bg: '#e8f5e8', color: '#2e7d32', text: '공개' }
    };

    const style = statusColors[status];

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>클라이언트 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>클라이언트 관리</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleClientCreate}
            style={{ 
              padding: '10px 20px', 
              background: '#28a745', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ➕ 클라이언트 생성
          </button>
          <button 
            onClick={handleBackToMain}
            style={{ 
              padding: '10px 20px', 
              background: '#666', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 16, padding: 12, backgroundColor: '#ffe8e8', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: 8, 
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1.5fr 1fr 1fr 2fr',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          borderBottom: '1px solid #ddd'
        }}>
          <div>이름</div>
          <div>클라이언트 타입</div>
          <div>상태</div>
          <div>프로필 이미지</div>
          <div>소개</div>
        </div>

        {clients.map((client, index) => {
          // 배경 이미지 URL 처리
          const cleanBgUrl = client.backgroundImageUrl?.startsWith('/')
            ? client.backgroundImageUrl.substring(1)
            : client.backgroundImageUrl;
          const bgFullUrl = client.backgroundImageUrl
            ? `${process.env.REACT_APP_API_URL}/${cleanBgUrl}?cache=${Date.now()}`
            : undefined;

          return (
            <div key={index}
              onClick={() => client.id && navigate(`/client/edit/${client.id}`)}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1.5fr 1fr 1fr 2fr',
                padding: '16px',
                borderBottom: '1px solid #eee',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: bgFullUrl
                  ? `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('${bgFullUrl}') center/cover no-repeat`
                  : undefined,
                cursor: 'pointer',
                transition: 'background 0.2s',
                userSelect: 'none',
              }}
              onMouseOver={e => (e.currentTarget.style.background = bgFullUrl ? `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('${bgFullUrl}') center/cover no-repeat` : '')}
              onMouseOut={e => (e.currentTarget.style.background = bgFullUrl ? `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('${bgFullUrl}') center/cover no-repeat` : '')}
            >
              <div style={{ fontWeight: 'bold', zIndex: 1, pointerEvents: 'none' }}>{client.name || '-'}</div>
              <div style={{ zIndex: 1, pointerEvents: 'none' }}>{getClientTypeBadge(client.clientType)}</div>
              <div style={{ zIndex: 1, pointerEvents: 'none' }}>{getStatusBadge(client.status)}</div>
              <div style={{ zIndex: 1, pointerEvents: 'none' }}>
                {client.profileImageUrl ? (
                  (() => {
                    const cleanUrl = client.profileImageUrl.startsWith('/') 
                      ? client.profileImageUrl.substring(1) 
                      : client.profileImageUrl;
                    const fullImageUrl = `${process.env.REACT_APP_API_URL}/${cleanUrl}`;
                    return (
                      <img 
                        src={`${fullImageUrl}?cache=${Date.now()}`}
                        alt="프로필" 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '1px solid #ddd'
                        }} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.setAttribute('style', 'display: flex');
                        }}
                      />
                    );
                  })()
                ) : null}
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f0f0f0',
                  display: client.profileImageUrl ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  없음
                </div>
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4', zIndex: 1, pointerEvents: 'none' }}>
                {truncateText(client.introduction, 100)}
              </div>
              {/* 상품 관리하기 버튼 */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/client/${client.id}/items`);
                }}
                style={{
                  position: 'absolute',
                  right: 140,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px 16px',
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  zIndex: 2
                }}
              >
                상품 관리하기
              </button>
              {/* 클라이언트 제거 버튼 */}
              <button
                onClick={async e => {
                  e.stopPropagation();
                  if (!window.confirm('정말 이 클라이언트를 삭제하시겠습니까?')) return;
                  try {
                    await api.delete(`/admin/client/${client.id}`);
                    alert('클라이언트가 삭제되었습니다!');
                    window.location.reload();
                  } catch {
                    alert('삭제 실패');
                  }
                }}
                style={{
                  position: 'absolute',
                  right: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px 16px',
                  background: '#c62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  zIndex: 2
                }}
              >
                클라이언트 제거
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', color: '#666' }}>
        총 {clients.length}명의 클라이언트가 있습니다.
      </div>
    </div>
  );
};

export default ClientManagement; 