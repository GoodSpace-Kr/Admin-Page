import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const QuestionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DELIVERY' | 'ORDER' | 'ITEM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');
  
  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'TITLE' | 'AUTHOR' | 'CONTENT' | 'ID' | 'ALL'>('TITLE');

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, typeFilter, statusFilter, searchKeyword, searchType]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<QuestionInfo[]>('/admin/question');
      setQuestions(response.data);
    } catch (err: any) {
      setError('문의 목록을 불러오는데 실패했습니다.');
      console.error('문의 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleQuestionDetail = (questionId: number) => {
    navigate(`/question/${questionId}`);
  };

  const applyFilters = () => {
    let filtered = questions;

    // 유형 필터 적용
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(question => question.questionType === typeFilter);
    }

    // 상태 필터 적용
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(question => question.questionStatus === statusFilter);
    }

    // 검색 필터 적용
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = filtered.filter(question => {
        switch (searchType) {
          case 'TITLE':
            return question.title.toLowerCase().includes(keyword);
          case 'AUTHOR':
            return question.userEmail.toLowerCase().includes(keyword);
          case 'CONTENT':
            return question.content.toLowerCase().includes(keyword);
          case 'ID':
            return question.id.toString().includes(keyword);
          case 'ALL':
            return (
              question.title.toLowerCase().includes(keyword) ||
              question.userEmail.toLowerCase().includes(keyword) ||
              question.content.toLowerCase().includes(keyword) ||
              question.id.toString().includes(keyword)
            );
          default:
            return true;
        }
      });
    }

    setFilteredQuestions(filtered);
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
        console.log('알 수 없는 상태:', status);
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

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24, textAlign: 'center' }}>
        <div>문의 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>고객 문의 관리</h1>
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

      <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden' }}>
        {/* 필터 영역 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
              문의 목록 ({filteredQuestions.length}건)
            </h2>
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>유형:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'DELIVERY' | 'ORDER' | 'ITEM')}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="ALL">전체</option>
                  <option value="DELIVERY">배송</option>
                  <option value="ORDER">주문</option>
                  <option value="ITEM">상품</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>상태:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'WAITING' | 'COMPLETED')}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="ALL">전체</option>
                  <option value="WAITING">대기중</option>
                  <option value="COMPLETED">완료</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 영역 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>검색:</label>
                             <select
                 value={searchType}
                 onChange={(e) => setSearchType(e.target.value as 'TITLE' | 'AUTHOR' | 'CONTENT' | 'ID' | 'ALL')}
                 style={{
                   padding: '6px 12px',
                   border: '1px solid #ddd',
                   borderRadius: 4,
                   fontSize: '14px',
                   backgroundColor: '#fff'
                 }}
               >
                 <option value="TITLE">제목</option>
                 <option value="AUTHOR">작성자</option>
                 <option value="CONTENT">내용</option>
                 <option value="ID">ID</option>
                 <option value="ALL">전체</option>
               </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="검색어를 입력하세요..."
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: '14px',
                  flex: 1,
                  maxWidth: 300
                }}
              />
              <button
                onClick={() => setSearchKeyword('')}
                style={{
                  padding: '8px 12px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 테이블 영역 */}
        {filteredQuestions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666' }}>
            {questions.length === 0 ? '등록된 문의가 없습니다.' : '필터 조건에 맞는 문의가 없습니다.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    ID
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    제목
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    유형
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    상태
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    작성자
                  </th>
                                     <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                     작성일
                   </th>
                </tr>
              </thead>
              <tbody>
                                 {filteredQuestions.map((question) => (
                   <tr 
                     key={question.id} 
                     style={{ 
                       borderBottom: '1px solid #eee',
                       cursor: 'pointer',
                       transition: 'background-color 0.2s'
                     }}
                     onClick={() => handleQuestionDetail(question.id)}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = '#f5f5f5';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = '';
                     }}
                   >
                    <td style={{ padding: '12px 16px' }}>
                      #{question.id}
                    </td>
                                         <td style={{ padding: '12px 16px', maxWidth: 300 }}>
                       <div 
                         style={{ 
                           overflow: 'hidden',
                           textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap'
                         }}
                         title={question.title}
                       >
                         {question.title}
                       </div>
                     </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getTypeText(question.questionType)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: getStatusColor(question.questionStatus)
                      }}>
                        {getStatusText(question.questionStatus)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {question.userEmail}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {formatDate(question.createdAt)}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManagement; 