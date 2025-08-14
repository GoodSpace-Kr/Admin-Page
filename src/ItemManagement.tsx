import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from './api';

interface ItemInfo {
  id: number;
  name: string;
  price: number;
  shortDescription: string;
  landingPageDescription: string;
  imageUrls: string[];
  status: 'PRIVATE' | 'TEST' | 'PUBLIC';
  titleImageUrl?: string;
}

interface ClientDetail {
  id: number;
  name: string;
  profileImageUrl: string;
  backgroundImageUrl: string;
  introduction: string;
  clientType: string;
  status: 'PRIVATE' | 'TEST' | 'PUBLIC';
}

const ItemManagement: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    fetchClient();
    fetchItems();
    // eslint-disable-next-line
  }, [clientId]);

  const fetchClient = async () => {
    if (!clientId) return;
    setClientLoading(true);
    try {
      const res = await api.get<ClientDetail>(`/admin/client/${clientId}`);
      setClient(res.data);
    } catch {
      setClient(null);
    } finally {
      setClientLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get<ItemInfo[]>(`/admin/item`, { params: { clientId } });
      setItems(response.data);
    } catch (err: any) {
      setError('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (itemId: number) => {
    navigate(`/client/${clientId}/items/${itemId}/edit`);
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete('/admin/item', {
        data: { clientId: Number(clientId), itemId },
      } as any);
      alert('삭제가 완료되었습니다!');
      // 페이지 새로고침 대신 상품 목록을 다시 불러옴
      fetchItems();
    } catch {
      alert('삭제 실패');
    }
  };

  const handleAdd = () => {
    navigate(`/client/${clientId}/items/add`);
  };

  const getStatusBadge = (status: 'PRIVATE' | 'TEST' | 'PUBLIC') => {
    const statusColors = {
      'PRIVATE': { bg: '#ffebee', color: '#c62828', text: '비공개' },
      'TEST': { bg: '#fff3e0', color: '#f57c00', text: '테스트' },
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

  const renderMarkdownDescription = (description: string, maxLength: number = 100) => {
    if (!description) return '-';
    
    // 마크다운 텍스트를 제한 (마크다운 문법은 유지)
    const truncatedText = description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
    
    return (
      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // 헤더 크기 제한
            h1: ({children}) => <div style={{fontSize: '16px', fontWeight: 'bold', margin: '4px 0'}}>{children}</div>,
            h2: ({children}) => <div style={{fontSize: '15px', fontWeight: 'bold', margin: '4px 0'}}>{children}</div>,
            h3: ({children}) => <div style={{fontSize: '14px', fontWeight: 'bold', margin: '4px 0'}}>{children}</div>,
            // 리스트 스타일 조정
            ul: ({children}) => <div style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</div>,
            ol: ({children}) => <div style={{margin: '4px 0', paddingLeft: '16px'}}>{children}</div>,
            li: ({children}) => <div style={{margin: '2px 0'}}>{children}</div>,
            // 인용문 스타일
            blockquote: ({children}) => <div style={{borderLeft: '3px solid #ddd', paddingLeft: '8px', margin: '4px 0', fontStyle: 'italic'}}>{children}</div>,
            // 코드 스타일
            code: ({children}) => <span style={{backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '12px'}}>{children}</span>,
            // 링크 스타일
            a: ({children, href}) => <span style={{color: '#1976d2', textDecoration: 'underline'}}>{children}</span>,
            // 이미지 숨김 (목록에서는 이미지 표시하지 않음)
            img: () => null,
            // 코드블록 스타일
            pre: ({children}) => <div style={{backgroundColor: '#f5f5f5', padding: '4px', borderRadius: '3px', fontSize: '12px', fontFamily: 'monospace', margin: '4px 0'}}>{children}</div>
          }}
        >
          {truncatedText}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      {/* 돌아가기 버튼 */}
      <button
        onClick={() => navigate('/clients')}
        style={{ marginBottom: 20, background: '#666', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
      >
        ← 돌아가기
      </button>
      {/* 클라이언트 정보 상단 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        {clientLoading ? (
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>클라이언트 정보를 불러오는 중...</div>
        ) : client ? (
          <>
            <img
              src={`${process.env.REACT_APP_API_URL}${client.profileImageUrl.startsWith('/') ? client.profileImageUrl : '/' + client.profileImageUrl}?cache=${Date.now()}`}
              alt="프로필"
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginRight: 20, border: '1px solid #ddd' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
            <span style={{ fontWeight: 'bold', fontSize: 24 }}>{client.name}</span>
          </>
        ) : (
          <div style={{ color: 'red' }}>클라이언트 정보를 불러올 수 없습니다.</div>
        )}
      </div>
      <h1>상품 관리</h1>
      <button onClick={handleAdd} style={{ marginBottom: 20, background: '#28a745', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
        + 상품 추가
      </button>
      {loading ? (
        <div>상품 목록을 불러오는 중...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>이름</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>가격</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>상태</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>타이틀 이미지</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>간단 설명</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>상세 설명</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>이미지</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr 
                key={item.id}
                onClick={() => handleEdit(item.id)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.id}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.price.toLocaleString()}원</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{getStatusBadge(item.status)}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  {item.titleImageUrl ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL}${item.titleImageUrl.startsWith('/') ? item.titleImageUrl : '/' + item.titleImageUrl}?cache=${Date.now()}`}
                      alt="타이틀 이미지"
                      style={{ 
                        width: 80, 
                        height: 50, 
                        objectFit: 'cover', 
                        borderRadius: 4,
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.setAttribute('style', 'display: flex');
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: 80, 
                      height: 50, 
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#999',
                      borderRadius: 4
                    }}>
                      없음
                    </div>
                  )}
                </td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{renderMarkdownDescription(item.shortDescription, 80)}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{renderMarkdownDescription(item.landingPageDescription, 120)}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                      {item.imageUrls
                        .map((imageUrl, index) => {
                        const cleanUrl = imageUrl.startsWith('/') 
                          ? imageUrl.substring(1) 
                          : imageUrl;
                        const fullImageUrl = `${process.env.REACT_APP_API_URL}/${cleanUrl}`;
                        return (
                          <div key={index} style={{ position: 'relative' }}>
                            <img 
                              src={`${fullImageUrl}?cache=${Date.now()}`}
                              alt={`상품 이미지 ${index + 1}`}
                              style={{ 
                                width: 50, 
                                height: 50, 
                                objectFit: 'cover', 
                                borderRadius: 4,
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {item.imageUrls.length > 1 && (
                              <div style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: '#666',
                                color: '#fff',
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '8px',
                                minWidth: '16px',
                                textAlign: 'center'
                              }}>
                                {index + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ 
                      width: 60, 
                      height: 60, 
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#999',
                      borderRadius: 6
                    }}>
                      없음
                    </div>
                  )}
                </td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }} 
                    style={{ 
                      background: '#c62828', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '6px 12px', 
                      cursor: 'pointer' 
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ItemManagement; 