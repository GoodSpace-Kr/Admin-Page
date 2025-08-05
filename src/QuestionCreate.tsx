import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const QuestionCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 문의 정보
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'DELIVERY' | 'ORDER' | 'ITEM'>('DELIVERY');
  const [files, setFiles] = useState<File[]>([]);

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // FormData 생성
      const formData = new FormData();
      
      // 문의 정보를 JSON 문자열로 변환하여 추가
      const questionData = {
        title: title.trim(),
        content: content.trim(),
        type: type
      };
      formData.append('question', new Blob([JSON.stringify(questionData)], {
        type: 'application/json'
      }));
      
      // 파일들 추가
      files.forEach((file, index) => {
        formData.append('file', file);
      });

      await api.post('/api/qna', formData);
      
      alert('문의가 성공적으로 생성되었습니다!');
      navigate('/questions');
    } catch (err: any) {
      setError(err.response?.data?.message || '문의 생성에 실패했습니다.');
      console.error('문의 생성 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return '배송';
      case 'ORDER':
        return '주문';
      case 'ITEM':
        return '상품';
      default:
        return type;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>문의 생성 (테스트용)</h1>
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
        <h2 style={{ marginBottom: 24, color: '#333' }}>문의 정보</h2>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            placeholder="문의 제목을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            문의 유형 *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'DELIVERY' | 'ORDER' | 'ITEM')}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          >
            <option value="DELIVERY">배송</option>
            <option value="ORDER">주문</option>
            <option value="ITEM">상품</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            내용 *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, minHeight: 150, resize: 'vertical' }}
            placeholder="문의 내용을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            첨부 파일 (선택사항)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            disabled={loading}
          />
          {files.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 'bold' }}>
                선택된 파일 ({files.length}개):
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {files.map((file, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: 4,
                      border: '1px solid #ddd'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '14px' }}>📎</span>
                      <span style={{ fontSize: '14px', color: '#333' }}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      disabled={loading}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
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
          {loading ? '생성 중...' : '문의 생성'}
        </button>
      </form>
    </div>
  );
};

export default QuestionCreate; 