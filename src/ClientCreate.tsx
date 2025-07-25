import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

interface ClientRegistrationRequest {
  name: string;
  encodedProfileImage: string;
  encodedBackgroundImage: string;
  introduction: string;
  clientType: 'CREATOR' | 'INFLUENCER';
}

const ClientCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 클라이언트 정보
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [introduction, setIntroduction] = useState('');
  const [clientType, setClientType] = useState<'CREATOR' | 'INFLUENCER'>('CREATOR');

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
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
        // Base64 데이터 URL에서 실제 Base64 부분만 추출
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!introduction.trim()) {
      setError('인삿말을 입력해주세요.');
      return;
    }
    if (!profileImage) {
      setError('프로필 사진을 선택해주세요.');
      return;
    }
    if (!backgroundImage) {
      setError('배경 사진을 선택해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 이미지를 Base64로 변환
      const [profileBase64, backgroundBase64] = await Promise.all([
        profileImage ? convertImageToBase64(profileImage) : '',
        backgroundImage ? convertImageToBase64(backgroundImage) : ''
      ]);

      const requestData: ClientRegistrationRequest = {
        name: name.trim(),
        encodedProfileImage: profileBase64,
        encodedBackgroundImage: backgroundBase64,
        introduction: introduction.trim(),
        clientType
      };

      await api.post('/admin/client', requestData);
      alert('클라이언트가 성공적으로 생성되었습니다!');
      navigate('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || '클라이언트 생성에 실패했습니다.');
      console.error('클라이언트 생성 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>클라이언트 생성</h1>
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

      {error && (
        <div style={{ color: 'red', marginBottom: 16, padding: 12, backgroundColor: '#ffe8e8', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, border: '1px solid #ddd' }}>
        {/* 클라이언트 기본 정보 */}
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
            프로필 사진 * (5MB 이하)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setProfileImage)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          />
          {profileImage && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              선택된 파일: {profileImage.name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            배경 사진 * (5MB 이하)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, setBackgroundImage)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          />
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

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '15px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold'
          }}
          disabled={loading}
        >
          {loading ? '생성 중...' : '클라이언트 생성'}
        </button>
      </form>
    </div>
  );
};

export default ClientCreate; 