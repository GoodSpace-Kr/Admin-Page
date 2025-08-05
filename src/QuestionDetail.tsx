import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import api from './api';

interface QuestionInfo {
  id: number;
  title: string;
  content: string;
  questionType: 'DELIVERY' | 'ORDER' | 'ITEM';
  questionStatus: 'WAITING' | 'COMPLETED';
  userEmail: string;
  createdAt: string;
}

interface AnswerInfo {
  id: number;
  content: string;
  updatedAt: string;
}

interface QuestionAndAnswerResponse {
  question: QuestionInfo;
  answer: AnswerInfo | null;
}

interface FileInfo {
  name: string;
  size: number;
  data: Blob;
}

interface AnswerRegisterRequest {
  questionId: number;
  content: string;
}

interface AnswerUpdateRequest {
  answerId: number;
  content: string;
}

const QuestionDetail: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState<QuestionAndAnswerResponse | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (questionId) {
      fetchQuestionDetail();
      fetchQuestionFiles();
    }
  }, [questionId]);

  const fetchQuestionDetail = async () => {
    try {
      const response = await api.get<QuestionAndAnswerResponse>(`/admin/question/${questionId}`);
      setQuestionData(response.data);
      
      // 기존 답변이 있다면 수정 모드에서 내용을 미리 설정
      if (response.data.answer) {
        setAnswerContent(response.data.answer.content);
      }
    } catch (err: any) {
      setError('문의 상세 정보를 불러오는데 실패했습니다.');
      console.error('문의 상세 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionFiles = async () => {
    setFileLoading(true);
    try {
      const response = await api.get(`/admin/question/${questionId}/file`, {
        responseType: 'blob'
      });
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(response.data as Blob);
      
      const fileList: FileInfo[] = [];
      
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir) {
          const blob = await file.async('blob');
          fileList.push({
            name: filename,
            size: (file as any)._data.uncompressedSize,
            data: blob
          });
        }
      }
      
      setFiles(fileList);
    } catch (err: any) {
      console.error('파일 다운로드 오류:', err);
      // 파일이 없는 경우는 에러로 처리하지 않음
    } finally {
      setFileLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/questions');
  };

  const handleDownloadFile = (file: FileInfo) => {
    const url = window.URL.createObjectURL(file.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      if (questionData?.answer && isEditing) {
        // 답변 수정
        const updateData: AnswerUpdateRequest = {
          answerId: questionData.answer.id,
          content: answerContent.trim()
        };

        await api.put('/admin/question/answer', updateData);
        alert('답변이 성공적으로 수정되었습니다.');
        setIsEditing(false);
      } else {
        // 답변 등록
        const answerData: AnswerRegisterRequest = {
          questionId: Number(questionId),
          content: answerContent.trim()
        };

        await api.post('/admin/question/answer', answerData);
        alert('답변이 성공적으로 등록되었습니다.');
        setAnswerContent('');
      }
      
      // 문의 정보를 다시 불러와서 상태 업데이트
      await fetchQuestionDetail();
    } catch (err: any) {
      alert(questionData?.answer && isEditing ? '답변 수정에 실패했습니다.' : '답변 등록에 실패했습니다.');
      console.error('답변 처리 오류:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleEditAnswer = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (questionData?.answer) {
      setAnswerContent(questionData.answer.content);
    } else {
      setAnswerContent('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return '#ff9800';
      case 'COMPLETED':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING':
        return '대기중';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24, textAlign: 'center' }}>
        <div>문의 상세 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24, textAlign: 'center' }}>
        <div>문의를 찾을 수 없습니다.</div>
        <button 
          onClick={handleBackToList}
          style={{ 
            marginTop: 16,
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
    );
  }

  const { question, answer } = questionData;

  return (
    <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>문의 상세보기</h1>
        <button 
          onClick={handleBackToList}
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

      <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
        {/* 문의 정보 */}
        <div style={{ padding: '24px', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                {question.title}
              </h2>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: getStatusColor(question.questionStatus)
                }}>
                  {getStatusText(question.questionStatus)}
                </span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: '#2196f3'
                }}>
                  {getTypeText(question.questionType)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '14px', color: '#666' }}>
              <div>작성자: {question.userEmail}</div>
              <div>작성일: {formatDate(question.createdAt)}</div>
            </div>
          </div>
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}>
            {question.content}
          </div>
        </div>

        {/* 첨부 파일 */}
        <div style={{ padding: '24px', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
            첨부 파일 ({files.length}개)
          </h3>
          
          {fileLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#666' }}>
              파일 목록을 불러오는 중...
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#666' }}>
              첨부된 파일이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {files.map((file, index) => (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: 4,
                    border: '1px solid #ddd'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '16px' }}>📎</span>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    style={{
                      padding: '6px 12px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    다운로드
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 답변 영역 */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
            답변
          </h3>
          
          {answer ? (
            // 기존 답변이 있는 경우
            <div>
              {!isEditing ? (
                // 답변 표시 모드
                <div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: 4,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    marginBottom: 16
                  }}>
                    {answer.content}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      수정일: {formatDate(answer.updatedAt)}
                    </div>
                    <button
                      onClick={handleEditAnswer}
                      style={{
                        padding: '8px 16px',
                        background: '#2196f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      답변 수정
                    </button>
                  </div>
                </div>
              ) : (
                // 답변 수정 모드
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <textarea
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      placeholder="답변 내용을 입력하세요..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '10px 20px',
                        background: '#666',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submittingAnswer || !answerContent.trim()}
                      style={{
                        padding: '10px 20px',
                        background: submittingAnswer || !answerContent.trim() ? '#ccc' : '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: submittingAnswer || !answerContent.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {submittingAnswer ? '수정 중...' : '답변 수정'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 답변이 없는 경우 - 등록 모드
            <div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submittingAnswer || !answerContent.trim()}
                  style={{
                    padding: '10px 20px',
                    background: submittingAnswer || !answerContent.trim() ? '#ccc' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: submittingAnswer || !answerContent.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {submittingAnswer ? '등록 중...' : '답변 등록'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail; 