import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

interface UserInfoDto {
  id: number;
  name: string | null;
  dateOfBirth: number | null;
  email: string;
  phoneNumber: string | null;
  roles: string[] | null;
  deliveryInfo: {
    id: number;
    recipientName: string;
    recipientPhoneNumber: string;
    zipCode: string;
    address: string;
    detailedAddress: string;
    isDefault: boolean;
  } | null;
  oauthType: 'GOOD_SPACE' | 'KAKAO' | 'NAVER' | 'GOOGLE' | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfoDto[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'ID' | 'NAME' | 'EMAIL' | 'PHONE' | 'BIRTH' | 'ROLE' | 'OAUTH' | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'id' | 'name' | 'email' | 'dateOfBirth'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDelivery, setSelectedDelivery] = useState<{
    id: number;
    recipientName: string;
    recipientPhoneNumber: string;
    zipCode: string;
    address: string;
    detailedAddress: string;
    isDefault: boolean;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserInfoDto[]>('/admin/user');
      console.log('회원 API 응답:', response.data);
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err: any) {
      setError('회원 목록을 불러오는데 실패했습니다.');
      console.error('회원 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 정렬 필터링
  useEffect(() => {
    let filtered = users;
    
    // 역할 매핑 (영문 -> 한글)
    const roleMapping: { [key: string]: string } = {
      'ADMIN': '관리자',
      'USER': '일반회원',
      'CREATOR': '크리에이터',
      'INFLUENCER': '인플루언서'
    };
    
    // OAuth 타입 매핑 (영문 -> 한글)
    const oauthMapping: { [key: string]: string } = {
      'GOOD_SPACE': 'GoodSpace',
      'KAKAO': '카카오',
      'NAVER': '네이버',
      'GOOGLE': '구글'
    };
    
    // 검색 필터링
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = users.filter(user => {
        switch (searchType) {
          case 'ID':
            return user.id.toString().includes(keyword);
          case 'NAME':
            return user.name && user.name.toLowerCase().includes(keyword);
          case 'EMAIL':
            return user.email && user.email.toLowerCase().includes(keyword);
          case 'PHONE':
            return user.phoneNumber && user.phoneNumber.toLowerCase().includes(keyword);
          case 'BIRTH':
            if (!user.dateOfBirth) return false;
            const birthStr = user.dateOfBirth.toString();
            return birthStr.includes(keyword);
          case 'ROLE':
            return user.roles && user.roles.length > 0 && user.roles.some(role => {
              if (!role) return false;
              const roleLower = role.toLowerCase();
              const roleKorean = roleMapping[role] || role;
              return roleLower.includes(keyword) || roleKorean.toLowerCase().includes(keyword);
            });
          case 'OAUTH':
            if (!user.oauthType) return false;
            const oauthLower = user.oauthType.toLowerCase();
            const oauthKorean = oauthMapping[user.oauthType] || user.oauthType;
            return oauthLower.includes(keyword) || oauthKorean.toLowerCase().includes(keyword);
          case 'ALL':
            return (
              (user.name && user.name.toLowerCase().includes(keyword)) ||
              (user.email && user.email.toLowerCase().includes(keyword)) ||
              (user.phoneNumber && user.phoneNumber.toLowerCase().includes(keyword)) ||
              user.id.toString().includes(keyword) ||
              (user.dateOfBirth && user.dateOfBirth.toString().includes(keyword)) ||
              (user.roles && user.roles.length > 0 && user.roles.some(role => {
                if (!role) return false;
                const roleLower = role.toLowerCase();
                const roleKorean = roleMapping[role] || role;
                return roleLower.includes(keyword) || roleKorean.toLowerCase().includes(keyword);
              })) ||
              (user.oauthType && (user.oauthType.toLowerCase().includes(keyword) || 
               (oauthMapping[user.oauthType] && oauthMapping[user.oauthType].toLowerCase().includes(keyword))))
            );
          default:
            return true;
        }
      });
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'dateOfBirth') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else {
        // null이나 undefined인 경우 빈 문자열로 처리
        aValue = aValue ? String(aValue).toLowerCase() : '';
        bValue = bValue ? String(bValue).toLowerCase() : '';
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredUsers(filtered);
  }, [searchKeyword, searchType, users, sortField, sortDirection]);

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`정말 "${userName}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await api.delete(`/admin/user?userId=${userId}`);
      alert('회원이 삭제되었습니다.');
      fetchUsers(); // 목록 새로고침
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSort = (field: 'id' | 'name' | 'email' | 'dateOfBirth') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'id' | 'name' | 'email' | 'dateOfBirth') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleShowDeliveryDetail = (deliveryInfo: any) => {
    setSelectedDelivery(deliveryInfo);
  };

  const getRoleBadge = (roles: string[] | null) => {
    if (!roles || roles.length === 0) {
      return <span style={{ color: '#999', fontSize: '12px' }}>역할 없음</span>;
    }

    const roleColors: { [key: string]: { bg: string; color: string; text: string } } = {
      'ADMIN': { bg: '#ffebee', color: '#c62828', text: '관리자' },
      'USER': { bg: '#e3f2fd', color: '#1976d2', text: '일반회원' },
      'CREATOR': { bg: '#fff3e0', color: '#f57c00', text: '크리에이터' },
      'INFLUENCER': { bg: '#fce4ec', color: '#c2185b', text: '인플루언서' }
    };

    return roles.map((role, index) => {
      if (!role) return null; // null인 role은 건너뛰기
      const style = roleColors[role] || { bg: '#f5f5f5', color: '#666', text: role };
      return (
        <span
          key={index}
          style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: style.bg,
            color: style.color,
            marginRight: '4px'
          }}
        >
          {style.text}
        </span>
      );
    });
  };

  const getOAuthTypeBadge = (oauthType: string | null) => {
    if (!oauthType) {
      return <span style={{ color: '#999', fontSize: '12px' }}>알 수 없음</span>;
    }

    const oauthColors: { [key: string]: { bg: string; color: string; text: string } } = {
      'GOOD_SPACE': { bg: '#e8f5e8', color: '#2e7d32', text: 'GoodSpace' },
      'KAKAO': { bg: '#fff8e1', color: '#f57f17', text: '카카오' },
      'NAVER': { bg: '#e8f5e8', color: '#2e7d32', text: '네이버' },
      'GOOGLE': { bg: '#ffebee', color: '#c62828', text: '구글' }
    };

    const style = oauthColors[oauthType] || { bg: '#f5f5f5', color: '#666', text: oauthType };

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const formatDateOfBirth = (dateOfBirth: number | null) => {
    if (!dateOfBirth) return '-';
    
    // dateOfBirth가 timestamp인지 확인 (1970년 이후인지)
    const date = new Date(dateOfBirth);
    if (date.getFullYear() < 1970) {
      // timestamp가 아닌 경우 (예: 19900101 형태)
      const dateStr = dateOfBirth.toString();
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
      return dateOfBirth.toString();
    }
    
    return date.toLocaleDateString('ko-KR');
  };

  const formatPhoneNumber = (phoneNumber: string | null) => {
    if (!phoneNumber) return '-';
    // 전화번호 포맷팅 (010-1234-5678)
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phoneNumber;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24, textAlign: 'center' }}>
        <div>회원 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>회원 관리</h1>
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
                <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#333' }}>
              회원 목록 ({filteredUsers.length}명 / 전체 {users.length}명)
            </h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                padding: '8px 12px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
        </div>

        {/* 검색 영역 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>검색:</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'ID' | 'NAME' | 'EMAIL' | 'PHONE' | 'BIRTH' | 'ROLE' | 'OAUTH' | 'ALL')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="ID">ID</option>
                <option value="NAME">이름</option>
                <option value="EMAIL">이메일</option>
                <option value="PHONE">전화번호</option>
                <option value="BIRTH">생년월일</option>
                <option value="ROLE">역할</option>
                <option value="OAUTH">로그인 방식</option>
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

        {filteredUsers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666' }}>
            {users.length === 0 ? '등록된 회원이 없습니다.' : '검색 조건에 맞는 회원이 없습니다.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('id')}
                  >
                    ID {getSortIcon('id')}
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('name')}
                  >
                    이름 {getSortIcon('name')}
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('email')}
                  >
                    이메일 {getSortIcon('email')}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    전화번호
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('dateOfBirth')}
                  >
                    생년월일 {getSortIcon('dateOfBirth')}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    역할
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    로그인 방식
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    배송지
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {user.id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>
                      {user.name || '이름 없음'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {formatPhoneNumber(user.phoneNumber)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {formatDateOfBirth(user.dateOfBirth)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {getRoleBadge(user.roles)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {getOAuthTypeBadge(user.oauthType)}
                    </td>
                                         <td style={{ padding: '12px 16px', fontSize: 14 }}>
                       {user.deliveryInfo ? (
                         <div>
                           <div style={{ fontWeight: 'bold' }}>{user.deliveryInfo.recipientName}</div>
                           <div style={{ fontSize: 12, color: '#666' }}>
                             {user.deliveryInfo.address}
                           </div>
                           {user.deliveryInfo.isDefault && (
                             <span style={{ fontSize: 11, color: '#1976d2', fontWeight: 'bold' }}>
                               기본배송지
                             </span>
                           )}
                           <button
                             onClick={() => handleShowDeliveryDetail(user.deliveryInfo)}
                             style={{
                               marginTop: 4,
                               padding: '4px 8px',
                               background: '#f0f0f0',
                               border: '1px solid #ddd',
                               borderRadius: 4,
                               cursor: 'pointer',
                               fontSize: 11
                             }}
                           >
                             상세보기
                           </button>
                         </div>
                       ) : (
                         <span style={{ color: '#999' }}>등록된 배송지 없음</span>
                       )}
                     </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name || '이름 없는 사용자')}
                        disabled={deleteLoading === user.id}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          opacity: deleteLoading === user.id ? 0.6 : 1
                        }}
                      >
                        {deleteLoading === user.id ? '삭제 중...' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배송지 상세 정보 모달 */}
      {selectedDelivery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: 24,
            borderRadius: 8,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#333' }}>배송지 상세 정보</h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>수령인</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {selectedDelivery.recipientName}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>연락처</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {formatPhoneNumber(selectedDelivery.recipientPhoneNumber)}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>우편번호</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {selectedDelivery.zipCode}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>주소</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {selectedDelivery.address}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>상세주소</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {selectedDelivery.detailedAddress || '-'}
              </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>기본 배송지 여부</label>
              <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                {selectedDelivery.isDefault ? '기본 배송지' : '일반 배송지'}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedDelivery(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 
