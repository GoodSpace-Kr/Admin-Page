import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

interface ItemInfo {
  id: number;
  name: string;
  price: number;
  shortDescription: string;
  landingPageDescription: string;
  imageUrls?: string[];
  status: 'PRIVATE' | 'PUBLIC';
}

interface ItemImageInfo {
  id: number;
  imageUrl: string;
}

interface TotalItemImageResponse {
  titleImageUrl: string | null;
  images: ItemImageInfo[];
}

const ItemEdit: React.FC = () => {
  const { clientId, itemId } = useParams<{ clientId: string; itemId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [landingPageDescription, setLandingPageDescription] = useState('');
  const [status, setStatus] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState<ItemImageInfo[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(0);
  
  // 타이틀 이미지 관련 상태
  const [titleImageUrl, setTitleImageUrl] = useState('');
  const [titleImageLoading, setTitleImageLoading] = useState(false);
  const [titleImageError, setTitleImageError] = useState('');
  const [titleImageCacheKey, setTitleImageCacheKey] = useState(0);

  useEffect(() => {
    fetchItem();
    fetchImages();
    // eslint-disable-next-line
  }, [clientId, itemId]);

  const fetchItem = async () => {
    if (!clientId || !itemId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get<ItemInfo[]>(`/admin/item`, { params: { clientId } });
      const items = res.data;
      const item = items.find((i) => String(i.id) === String(itemId));
      if (!item) {
        setError('상품 정보를 찾을 수 없습니다.');
        return;
      }
      setName(item.name);
      setPrice(String(item.price));
      setShortDescription(item.shortDescription);
      setLandingPageDescription(item.landingPageDescription);
      setStatus(item.status);
      // 타이틀 이미지는 fetchImages에서 처리하므로 여기서는 제거
    } catch (err: any) {
      setError('상품 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    if (!itemId) return;
    setImageLoading(true);
    setImageError('');
    try {
      const res = await api.get<TotalItemImageResponse>(`/admin/item/image`, { params: { itemId } });
      // 새로운 API 응답 구조에 맞게 처리
      const responseData = res.data;
      setImages(Array.isArray(responseData.images) ? responseData.images : []);
      setTitleImageUrl(responseData.titleImageUrl || '');
    } catch (err: any) {
      setImageError('이미지 목록을 불러오지 못했습니다.');
      setImages([]); // 에러 시 빈 배열로 설정
      setTitleImageUrl(''); // 에러 시 타이틀 이미지도 초기화
    } finally {
      setImageLoading(false);
    }
  };

  const handleDescEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !itemId) {
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
      await api.put('/admin/item', {
        clientId: Number(clientId),
        itemId: Number(itemId),
        name: name.trim(),
        price: Number(price),
        shortDescription: shortDescription.trim(),
        landingPageDescription: landingPageDescription.trim(),
        status,
      });
      alert('설명 수정이 완료되었습니다!');
      // 페이지 새로고침 대신 상품 정보를 다시 불러옴
      fetchItem();
    } catch (err: any) {
      setError(err.response?.data?.message || '설명 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setImageError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    setUploading(true);
    setImageError('');
    try {
      const base64 = await fileToBase64(file);
      await api.post('/admin/item/image', {
        clientId: Number(clientId),
        itemId: Number(itemId),
        encodedImage: base64,
      });
      alert('이미지 업로드가 완료되었습니다!');
      // 캐시 무효화를 위해 캐시 키 업데이트
      setImageCacheKey(prev => prev + 1);
      // 페이지 새로고침 대신 이미지 목록을 다시 불러옴
      fetchImages();
    } catch (err: any) {
      setImageError(err.response?.data?.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (itemImageId: number) => {
    if (!window.confirm('정말 이미지를 삭제하시겠습니까?')) return;
    setUploading(true);
    setImageError('');
    try {
      await api.delete('/admin/item/image', {
        data: {
          itemId: Number(itemId),
          itemImageId,
        },
      } as any);
      alert('이미지 삭제가 완료되었습니다!');
      // 캐시 무효화를 위해 캐시 키 업데이트
      setImageCacheKey(prev => prev + 1);
      // 페이지 새로고침 대신 이미지 목록을 다시 불러옴
      fetchImages();
    } catch (err: any) {
      setImageError(err.response?.data?.message || '이미지 삭제에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleTitleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setTitleImageError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    setTitleImageLoading(true);
    setTitleImageError('');
    try {
      const base64 = await fileToBase64(file);
      
      if (titleImageUrl) {
        // 기존 타이틀 이미지가 있으면 수정
        await api.put('/admin/item/image/title', {
          itemId: Number(itemId),
          encodedImage: base64,
        });
      } else {
        // 기존 타이틀 이미지가 없으면 새로 추가
        await api.post('/admin/item/image/title', {
          clientId: Number(clientId),
          itemId: Number(itemId),
          encodedImage: base64,
        });
      }
      
      alert('타이틀 이미지 업로드가 완료되었습니다!');
      // 캐시 무효화를 위해 캐시 키 업데이트 (타이틀 이미지와 일반 이미지 모두)
      setTitleImageCacheKey(prev => prev + 1);
      setImageCacheKey(prev => prev + 1);
      // 페이지 새로고침 대신 이미지 목록을 다시 불러옴
      fetchImages();
    } catch (err: any) {
      setTitleImageError(err.response?.data?.message || '타이틀 이미지 업로드에 실패했습니다.');
    } finally {
      setTitleImageLoading(false);
    }
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

  return (
    <div>
      {/* 고정 헤더 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        padding: '16px 24px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>상품 수정</h1>
        <button
          onClick={() => navigate(`/client/${clientId}/items`)}
          style={{ 
            background: '#666', 
            color: '#fff', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: 4, 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: 600, margin: '80px auto 40px', padding: '0 24px' }}>
      {loading ? (
        <div>상품 정보를 불러오는 중...</div>
      ) : (
        <form onSubmit={handleDescEdit} style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd', marginBottom: 32 }}>
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
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>상태 *</label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as 'PRIVATE' | 'PUBLIC';
                const statusText = newStatus === 'PRIVATE' ? '비공개' : '공개';
                if (window.confirm(`정말 "${statusText}"로 수정하시겠습니까?`)) {
                  setStatus(newStatus);
                } else {
                  // 취소 시 원래 값으로 되돌리기
                  e.target.value = status;
                }
              }}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              disabled={loading}
            >
              <option value="PRIVATE">비공개</option>
              <option value="PUBLIC">공개</option>
            </select>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: '#1976d2', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', fontSize: 16 }}>
            설명 수정
          </button>
        </form>
      )}
      {/* 이미지 목록 및 업로드/삭제 */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd' }}>
        <h2 style={{ marginBottom: 16 }}>상품 이미지</h2>
        {imageLoading ? (
          <div>이미지 목록을 불러오는 중...</div>
        ) : imageError ? (
          <div style={{ color: 'red', marginBottom: 16 }}>{imageError}</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            {Array.isArray(images) && images
              .map(img => (
              <div key={img.id} style={{ position: 'relative', width: 100, height: 100, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
                <img 
                  src={`${process.env.REACT_APP_API_URL}${img.imageUrl.startsWith('/') ? img.imageUrl : '/' + img.imageUrl}?cache=${imageCacheKey}`} 
                  alt="상품 이미지" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.setAttribute('style', 'display: flex');
                  }}
                />
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: '#f0f0f0',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  이미지 로드 실패
                </div>
                <button
                  onClick={() => handleImageDelete(img.id)}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}
                  disabled={uploading}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
        <label style={{ display: 'inline-block', background: '#1976d2', color: '#fff', padding: '8px 18px', borderRadius: 4, fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
          이미지 추가
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
        </label>
        {imageError && <div style={{ color: 'red', marginTop: 12 }}>{imageError}</div>}
      </div>
      {/* 타이틀 이미지 관리 */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd', marginTop: 16 }}>
        <h2 style={{ marginBottom: 16 }}>타이틀 이미지</h2>
        {titleImageLoading ? (
          <div>타이틀 이미지를 불러오는 중...</div>
        ) : titleImageError ? (
          <div style={{ color: 'red', marginBottom: 16 }}>{titleImageError}</div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {titleImageUrl ? (
              <div style={{ position: 'relative', width: 200, height: 120, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fafafa', marginBottom: 16 }}>
                <img 
                  src={`${process.env.REACT_APP_API_URL}${titleImageUrl.startsWith('/') ? titleImageUrl : '/' + titleImageUrl}?cache=${titleImageCacheKey}`} 
                  alt="타이틀 이미지" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.setAttribute('style', 'display: flex');
                  }}
                />
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: '#f0f0f0',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  이미지 로드 실패
                </div>
              </div>
            ) : (
              <div style={{ 
                width: 200, 
                height: 120, 
                border: '2px dashed #ddd', 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                color: '#999',
                fontSize: '14px',
                marginBottom: 16
              }}>
                타이틀 이미지 없음
              </div>
            )}
            <label style={{ 
              display: 'inline-block', 
              background: '#1976d2', 
              color: '#fff', 
              padding: '8px 18px', 
              borderRadius: 4, 
              fontWeight: 'bold', 
              cursor: titleImageLoading ? 'not-allowed' : 'pointer', 
              opacity: titleImageLoading ? 0.6 : 1 
            }}>
              {titleImageUrl ? '타이틀 이미지 변경' : '타이틀 이미지 추가'}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleTitleImageUpload} 
                disabled={titleImageLoading} 
              />
            </label>
          </div>
        )}
        {titleImageError && <div style={{ color: 'red', marginTop: 12 }}>{titleImageError}</div>}
      </div>
      </div>
    </div>
  );
};

export default ItemEdit; 