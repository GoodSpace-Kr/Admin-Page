import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

interface ItemInfo {
  id: number;
  name: string;
  price: number;
  shortDescription: string;
  landingPageDescription: string;
  imageUrls: string[];
}

interface ClientDetail {
  id: number;
  name: string;
  profileImageUrl: string;
  backgroundImageUrl: string;
  introduction: string;
  clientType: string;
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
      window.location.reload();
    } catch {
      alert('삭제 실패');
    }
  };

  const handleAdd = () => {
    navigate(`/client/${clientId}/items/add`);
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
              src={client.profileImageUrl}
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
              <th style={{ padding: 10, border: '1px solid #ddd' }}>간단 설명</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>상세 설명</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>이미지</th>
              <th style={{ padding: 10, border: '1px solid #ddd' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.id}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.price.toLocaleString()}원</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.shortDescription}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.landingPageDescription}</td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt="상품 이미지" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                  ) : '없음'}
                </td>
                <td style={{ padding: 10, border: '1px solid #ddd' }}>
                  <button onClick={() => handleEdit(item.id)} style={{ marginRight: 8, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>수정</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>삭제</button>
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