import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from './api';

const ItemAdd: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [landingPageDescription, setLandingPageDescription] = useState('');
  const [images, setImages] = useState<(File | null)[]>([null]);
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeShortTab, setActiveShortTab] = useState<'write' | 'preview'>('write');
  const [activeDetailTab, setActiveDetailTab] = useState<'write' | 'preview'>('write');

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

  const handleTitleImageChange = (file: File | null) => {
    setTitleImage(file);
  };

  const insertMarkdown = (syntax: string, field: 'short' | 'detail') => {
    const textareaId = field === 'short' ? 'short-description-textarea' : 'detail-description-textarea';
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = field === 'short' ? shortDescription : landingPageDescription;
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

      if (field === 'short') {
        setShortDescription(newText);
      } else {
        setLandingPageDescription(newText);
      }
      
      // 커서 위치 복원
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
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
      // 1. 상품 등록 (JSON 형식)
      await api.post('/admin/item', {
        clientId: Number(clientId),
        name: name.trim(),
        price: Number(price),
        shortDescription: shortDescription.trim(),
        landingPageDescription: landingPageDescription.trim(),
      });
      
      // 2. 상품 목록을 다시 조회해서 방금 등록한 상품의 ID를 찾기
      const itemsRes = await api.get('/admin/item', { params: { clientId } });
      const items = itemsRes.data as any[];
      const newItem = items.find((item: any) =>
        item.name === name.trim() &&
        item.price === Number(price) &&
        item.shortDescription === shortDescription.trim() &&
        item.landingPageDescription === landingPageDescription.trim()
      );
      
      if (!newItem || !newItem.id) {
        alert('상품 등록 후 상품 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 3. 타이틀 이미지가 있으면 업로드 (multipart/form-data)
      if (titleImage) {
        const titleImageFormData = new FormData();
        titleImageFormData.append('clientId', clientId);
        titleImageFormData.append('itemId', newItem.id.toString());
        titleImageFormData.append('image', titleImage);
        
        await api.post('/admin/item/image/title', titleImageFormData);
      }

      // 4. 일반 이미지가 있으면 순차적으로 업로드 (multipart/form-data)
      for (const file of images) {
        if (file) {
          const imageFormData = new FormData();
          imageFormData.append('clientId', clientId);
          imageFormData.append('itemId', newItem.id.toString());
          imageFormData.append('image', file);
          
          await api.post('/admin/item/image', imageFormData);
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

  const MarkdownToolbar = ({ field }: { field: 'short' | 'detail' }) => (
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
        onClick={() => insertMarkdown('bold', field)}
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
        onClick={() => insertMarkdown('italic', field)}
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
        onClick={() => insertMarkdown('link', field)}
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
        onClick={() => insertMarkdown('image', field)}
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
        onClick={() => insertMarkdown('code', field)}
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
        onClick={() => insertMarkdown('codeblock', field)}
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
        onClick={() => insertMarkdown('quote', field)}
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
        onClick={() => insertMarkdown('list', field)}
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
        onClick={() => insertMarkdown('numbered', field)}
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
        onClick={() => insertMarkdown('h1', field)}
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
        onClick={() => insertMarkdown('h2', field)}
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
        onClick={() => insertMarkdown('h3', field)}
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
  );

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 24 }}>
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
        
        {/* 간단 설명 마크다운 에디터 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>간단 설명 *</label>
          <MarkdownToolbar field="short" />
          
          {/* 탭 버튼 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
              <button
                type="button"
                onClick={() => setActiveShortTab('write')}
                style={{
                  padding: '12px 24px',
                  background: activeShortTab === 'write' ? '#1976d2' : '#fff',
                  color: activeShortTab === 'write' ? '#fff' : '#333',
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
                onClick={() => setActiveShortTab('preview')}
                style={{
                  padding: '12px 24px',
                  background: activeShortTab === 'preview' ? '#1976d2' : '#fff',
                  color: activeShortTab === 'preview' ? '#fff' : '#333',
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
          {activeShortTab === 'write' ? (
            <textarea
              id="short-description-textarea"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 16, 
                border: '1px solid #ddd', 
                borderRadius: 4, 
                minHeight: 120, 
                resize: 'vertical',
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.6
              }}
              placeholder="상품의 간단한 설명을 마크다운 문법으로 입력하세요&#10;&#10;예시:&#10;**특별한 기능**을 가진 상품입니다.&#10;&#10;- 주요 특징 1&#10;- 주요 특징 2"
              disabled={loading}
            />
          ) : (
            <div style={{
              padding: 16,
              border: '1px solid #ddd',
              borderRadius: 4,
              minHeight: 120,
              backgroundColor: '#fff',
              overflow: 'auto'
            }}>
              {shortDescription ? (
                <div style={{
                  lineHeight: 1.6,
                  fontSize: 14
                }}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                  >
                    {shortDescription}
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

        {/* 상세 설명 마크다운 에디터 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>상세 설명 *</label>
          <MarkdownToolbar field="detail" />
          
          {/* 탭 버튼 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
              <button
                type="button"
                onClick={() => setActiveDetailTab('write')}
                style={{
                  padding: '12px 24px',
                  background: activeDetailTab === 'write' ? '#1976d2' : '#fff',
                  color: activeDetailTab === 'write' ? '#fff' : '#333',
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
                onClick={() => setActiveDetailTab('preview')}
                style={{
                  padding: '12px 24px',
                  background: activeDetailTab === 'preview' ? '#1976d2' : '#fff',
                  color: activeDetailTab === 'preview' ? '#fff' : '#333',
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
          {activeDetailTab === 'write' ? (
            <textarea
              id="detail-description-textarea"
              value={landingPageDescription}
              onChange={(e) => setLandingPageDescription(e.target.value)}
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
              placeholder="상품의 상세한 설명을 마크다운 문법으로 입력하세요&#10;&#10;예시:&#10;# 상품 소개&#10;&#10;이 상품은 **혁신적인 기술**로 만들어졌습니다.&#10;&#10;## 주요 특징&#10;&#10;- 첫 번째 특징&#10;- 두 번째 특징&#10;&#10;## 사용법&#10;&#10;> 간단하고 편리하게 사용할 수 있습니다.&#10;&#10;```&#10;사용 예시 코드&#10;```"
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
              {landingPageDescription ? (
                <div style={{
                  lineHeight: 1.6,
                  fontSize: 14
                }}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                  >
                    {landingPageDescription}
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>타이틀 이미지 (선택사항)</label>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <input
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={e => handleTitleImageChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              style={{ flex: 1 }}
            />
            {titleImage && (
              <button
                type="button"
                onClick={() => handleTitleImageChange(null)}
                style={{ marginLeft: 8, background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
                disabled={loading}
              >
                삭제
              </button>
            )}
          </div>
          {titleImage && (
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
              선택된 파일: {titleImage.name}
            </div>
          )}
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
