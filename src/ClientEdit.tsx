import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from './api';

interface ClientDetail {
  id: number;
  name: string;
  profileImageUrl: string;
  backgroundImageUrl: string;
  introduction: string;
  clientType: 'CREATOR' | 'INFLUENCER';
  status: 'PRIVATE' | 'TEST' | 'PUBLIC';
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
  const [status, setStatus] = useState<'PRIVATE' | 'TEST' | 'PUBLIC'>('PRIVATE');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

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
      // FormData 생성
      const formData = new FormData();
      formData.append('id', id.toString());
      formData.append('name', name.trim());
      formData.append('introduction', introduction.trim());
      formData.append('clientType', clientType);
      formData.append('status', status);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      if (backgroundImage) {
        formData.append('backgroundImage', backgroundImage);
      }

      await api.put('/admin/client', formData);
      
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

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('introduction-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = introduction;
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);

      let newText = '';
      let newCursorPos = start;

      switch (syntax) {
        case 'bold':
          newText = before + `**${selected}**` + after;
          newCursorPos = start + 2;
          break;
        case 'italic':
          newText = before + `*${selected}*` + after;
          newCursorPos = start + 1;
          break;
        case 'link':
          newText = before + `[${selected}](URL)` + after;
          newCursorPos = start + selected.length + 3;
          break;
        case 'image':
          newText = before + `![${selected}](이미지URL)` + after;
          newCursorPos = start + selected.length + 6;
          break;
        case 'code':
          newText = before + `\`${selected}\`` + after;
          newCursorPos = start + 1;
          break;
        case 'codeblock':
          newText = before + `\`\`\`\n${selected}\n\`\`\`` + after;
          newCursorPos = start + 4;
          break;
        case 'quote':
          newText = before + `> ${selected}` + after;
          newCursorPos = start + 2;
          break;
        case 'list':
          newText = before + `- ${selected}` + after;
          newCursorPos = start + 2;
          break;
        case 'numbered':
          newText = before + `1. ${selected}` + after;
          newCursorPos = start + 3;
          break;
        case 'h1':
          newText = before + `# ${selected}` + after;
          newCursorPos = start + 2;
          break;
        case 'h2':
          newText = before + `## ${selected}` + after;
          newCursorPos = start + 3;
          break;
        case 'h3':
          newText = before + `### ${selected}` + after;
          newCursorPos = start + 4;
          break;
      }

      setIntroduction(newText);
      
      // 커서 위치 복원
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>클라이언트 정보 수정</h1>
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
              const newStatus = e.target.value as 'PRIVATE' | 'TEST' | 'PUBLIC';
              const statusText = newStatus === 'PRIVATE' ? '비공개' : newStatus === 'TEST' ? '테스트' : '공개';
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
            <option value="TEST">테스트</option>
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
              <img src={`${process.env.REACT_APP_API_URL}${profileImageUrl.startsWith('/') ? profileImageUrl : '/' + profileImageUrl}?cache=${Date.now()}`} alt="프로필 미리보기" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
            </div>
          )}
          {profileImage && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              선택된 파일: {profileImage.name}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 24 }}>
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
              <img src={`${process.env.REACT_APP_API_URL}${backgroundImageUrl.startsWith('/') ? backgroundImageUrl : '/' + backgroundImageUrl}?cache=${Date.now()}`} alt="배경 미리보기" style={{ width: 120, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd' }} />
            </div>
          )}
          {backgroundImage && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              선택된 파일: {backgroundImage.name}
            </div>
          )}
        </div>

        {/* 마크다운 에디터 섹션 */}
        <h2 style={{ marginBottom: 24, color: '#333' }}>인삿말 *</h2>
        
        {/* 마크다운 툴바 */}
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 4, 
          border: '1px solid #ddd',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <button
            type="button"
            onClick={() => insertMarkdown('bold')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            굵게
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('italic')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontStyle: 'italic'
            }}
            disabled={loading}
          >
            기울임
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('link')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={loading}
          >
            링크
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('image')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={loading}
          >
            이미지
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('code')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            disabled={loading}
          >
            코드
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('codeblock')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            disabled={loading}
          >
            코드블록
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('quote')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={loading}
          >
            인용
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('list')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={loading}
          >
            목록
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('numbered')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={loading}
          >
            번호목록
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('h1')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('h2')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('h3')}
            style={{
              padding: '6px 12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            disabled={loading}
          >
            H3
          </button>
        </div>

        {/* 탭 버튼 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'write' ? '#1976d2' : '#fff',
                color: activeTab === 'write' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderBottom: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              disabled={loading}
            >
              작성
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'preview' ? '#1976d2' : '#fff',
                color: activeTab === 'preview' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderBottom: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              disabled={loading}
            >
              미리보기
            </button>
          </div>
        </div>

        {/* 에디터/미리보기 영역 */}
        <div style={{ marginBottom: 24 }}>
          {activeTab === 'write' ? (
            <textarea
              id="introduction-textarea"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 16, 
                border: '1px solid #ddd', 
                borderRadius: 4, 
                minHeight: 300, 
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.6
              }}
              placeholder="클라이언트의 인삿말을 마크다운 문법으로 입력하세요&#10;&#10;예시:&#10;# 안녕하세요!&#10;&#10;저는 **크리에이터**입니다.&#10;&#10;- 첫 번째 특징&#10;- 두 번째 특징&#10;&#10;> 인용문도 사용할 수 있습니다."
              disabled={loading}
            />
          ) : (
            <div style={{
              padding: 16,
              border: '1px solid #ddd',
              borderRadius: 4,
              minHeight: 300,
              backgroundColor: '#fff',
              overflow: 'auto'
            }}>
              {introduction ? (
                <div style={{
                  lineHeight: 1.6,
                  fontSize: 14
                }}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                  >
                    {introduction}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  미리보기할 내용이 없습니다. 작성 탭에서 내용을 입력해주세요.
                </div>
              )}
            </div>
          )}
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
          {loading ? '수정 중...' : '클라이언트 정보 수정'}
        </button>
      </form>
    </div>
  );
};

export default ClientEdit; 