import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

const ItemAdd: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [landingPageDescription, setLandingPageDescription] = useState('');
  const [status, setStatus] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [images, setImages] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 각 입력폼에서 파일을 선택할 때 호출
  const handleImageChange = (idx: number, file: File | null) => {
    setImages(prev => {
      const newArr = [...prev];
      newArr[idx] = file;
      // 마지막 입력폼에 파일이 선택되면 새 입력폼 추가
      if (idx === prev.length - 1 && file) {
        newArr.push(null);
      }
      return newArr;
    });
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('잘못된 접근입니다.');
      return;
    }
    if (!name.trim() || !price.trim() || !shortDescription.trim() || !landingPageDescription.trim()) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1. 상품 등록
      const res = await api.post('/admin/item', {
        clientId: Number(clientId),
        name: name.trim(),
        price: Number(price),
        shortDescription: shortDescription.trim(),
        landingPageDescription: landingPageDescription.trim(),
      });
      // 2. 상품 등록 성공 시, 상품 목록을 다시 불러서 방금 등록한 상품의 id를 찾는다
      const itemsRes = await api.get('/admin/item', { params: { clientId } });
      const items = itemsRes.data as any[];
      const newItem = items.find((item: any) =>
        item.name === name.trim() &&
        item.price === Number(price) &&
        item.shortDescription === shortDescription.trim() &&
        item.landingPageDescription === landingPageDescription.trim()
      );
      if (!newItem) {
        alert('상품 등록 후 상품 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      // 3. 이미지가 있으면 순차적으로 업로드
      for (const file of images) {
        if (file) {
          const base64 = await fileToBase64(file);
          await api.post('/admin/item/image', {
            clientId: Number(clientId),
            itemId: newItem.id,
            encodedImage: base64,
          });
        }
      }
      alert('상품이 성공적으로 추가되었습니다!');
      navigate(`/client/${clientId}/items`);
    } catch (err: any) {
      setError(err.response?.data?.message || '상품 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h1>상품 추가</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>상품명 *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }} disabled={loading} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>가격 *</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }} disabled={loading} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>간단 설명 *</label>
          <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }} disabled={loading} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>상세 설명 *</label>
          <textarea value={landingPageDescription} onChange={e => setLandingPageDescription(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, minHeight: 80 }} disabled={loading} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>상품 이미지 (여러 장 순차 추가)</label>
          {images.map((file, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="file"
                accept="image/*"
                disabled={loading}
                onChange={e => handleImageChange(idx, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                style={{ flex: 1 }}
              />
              {file && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{ marginLeft: 8, background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
                  disabled={loading}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>
          {loading ? '등록 중...' : '상품 등록'}
        </button>
        <button type="button" onClick={() => navigate(-1)} style={{ marginLeft: 12, background: '#666', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }} disabled={loading}>
          취소
        </button>
      </form>
    </div>
  );
};

export default ItemAdd; 