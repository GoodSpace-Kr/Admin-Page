import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api';

interface ClientDetail {
  id: number;
  name: string;
  profileImageUrl: string;
  backgroundImageUrl: string;
  introduction: string;
  clientType: 'CREATOR' | 'INFLUENCER';
  status: 'PRIVATE' | 'PUBLIC';
}

const ClientEdit: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 폼 상태
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [clientType, setClientType] = useState<'CREATOR' | 'INFLUENCER'>('CREATOR');
  const [status, setStatus] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');

  useEffect(() => {
    if (!clientId) return;
    fetchClient();
    // eslint-disable-next-line
  }, [clientId]);

  const fetchClient = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<ClientDetail>(`/admin/client/${clientId}`);
      const data = res.data;
      setId(data.id);
      setName(data.name);
      setProfileImageUrl(data.profileImageUrl);
      setBackgroundImageUrl(data.backgroundImageUrl);
      setIntroduction(data.introduction);
      setClientType(data.clientType);
      setStatus(data.status);
    } catch (err: any) {
      setError('클라이언트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      setImage(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
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
    if (!id) {
      setError('잘못된 접근입니다.');
      return;
    }
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!introduction.trim()) {
      setError('인삿말을 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 이미지가 새로 업로드된 경우만 Base64로 변환, 아니면 기존 URL 유지
      let encodedProfileImage = profileImageUrl;
      let encodedBackgroundImage = backgroundImageUrl;
      const profileUpdated = !!profileImage;
      const backgroundUpdated = !!backgroundImage;
      if (profileImage) {
        encodedProfileImage = await convertImageToBase64(profileImage);
      }
      if (backgroundImage) {
        encodedBackgroundImage = await convertImageToBase64(backgroundImage);
      }
      const requestData = {
        id,
        name: name.trim(),
        encodedProfileImage,
        encodedBackgroundImage,
        introduction: introduction.trim(),
        clientType,
        status,
        profileUpdated,
        backgroundUpdated
      };
      await api.put('/admin/client', requestData);
      alert('클라이언트 정보가 수정되었습니다!');
      navigate('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || '클라이언트 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/clients');
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
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>클라이언트 정보 수정</h1>
        <button 
          onClick={handleBack}
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
          목록으로 돌아가기
        </button>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div style={{ maxWidth: 800, margin: '80px auto 120px', padding: '0 24px' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: 16, padding: 12, backgroundColor: '#ffe8e8', borderRadius: 4 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd' }}>
        <h2 style={{ marginBottom: 24, color: '#333' }}>기본 정보</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            placeholder="클라이언트 이름을 입력하세요"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            클라이언트 타입 *
          </label>
          <select
            value={clientType}
            onChange={(e) => setClientType(e.target.value as 'CREATOR' | 'INFLUENCER')}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          >
            <option value="CREATOR">CREATOR</option>
            <option value="INFLUENCER">INFLUENCER</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            상태 *
          </label>
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
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            프로필 사진 (5MB 이하)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setProfileImage)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          />
          {profileImageUrl && !profileImage && (
            <div style={{ marginTop: 8 }}>
              <img src={`${process.env.REACT_APP_API_URL}${profileImageUrl.startsWith('/') ? profileImageUrl : '/' + profileImageUrl}`} alt="프로필 미리보기" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
            </div>
          )}
          {profileImage && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              선택된 파일: {profileImage.name}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            배경 사진 (5MB 이하)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setBackgroundImage)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          />
          {backgroundImageUrl && !backgroundImage && (
            <div style={{ marginTop: 8 }}>
              <img src={`${process.env.REACT_APP_API_URL}${backgroundImageUrl.startsWith('/') ? backgroundImageUrl : '/' + backgroundImageUrl}`} alt="배경 미리보기" style={{ width: 120, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd' }} />
            </div>
          )}
          {backgroundImage && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              선택된 파일: {backgroundImage.name}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            인삿말 *
          </label>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, minHeight: 100, resize: 'vertical' }}
            placeholder="클라이언트의 인삿말을 입력하세요"
            disabled={loading}
          />
        </div>
      </form>
      
      {/* 고정 Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTop: '1px solid #ddd',
        padding: '16px 24px',
        zIndex: 1000,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          type="submit"
          onClick={handleSubmit}
          style={{
            padding: '15px 40px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold',
            minWidth: '200px'
          }}
          disabled={loading}
        >
          {loading ? '수정 중...' : '클라이언트 정보 수정'}
        </button>
      </div>
      </div>
    </div>
  );
};

export default ClientEdit; 