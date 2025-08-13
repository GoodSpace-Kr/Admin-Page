import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

interface PaymentApproveResult {
  resultCode: string;
  resultMsg: string;
  tid: string;
  cancelledTid: string;
  orderId: number;
  ediDate: string;
  signature: string;
  status: string;
  paidAt: string;
  failedAt: string;
  cancelledAt: string;
  payMethod: string;
  amount: number;
  balanceAmt: number;
  goodsName: string;
  mallReserved: string;
  useEscrow: boolean;
  currency: string;
  channel: string;
  approveNo: string;
  buyerName: string;
  buyerTel: string;
  buyerEmail: string;
  receiptUrl: string;
  mallUserId: string;
  issuedCashReceipt: boolean;
  cellphone: string;
  messageSource: string;
  bank?: {
    bankCode: string;
    bankName: string;
  };
  cancels?: Array<{
    cancelDate: string;
    cancelAmount: string;
    cancelReason: string;
    cancelType: string;
  }>;
  cashReceipts?: Array<{
    receiptId: string;
    orgTid: string;
    status: string;
    amount: number;
    taxFreeAmt: number;
    receiptType: string;
    issueNo: string;
    receiptUrl: string;
  }>;
  vbank?: {
    vbankName: string;
    vbankNumber: string;
    vbankCode: string;
    vbankExpDate: string;
    vbankHolder: string;
  };
  coupon?: {
    couponAmt: number;
  };
  card?: {
    cardCode: string;
    cardName: string;
    cardNum: string;
    cardQuota: number;
    interestFree: boolean;
    cardType: string;
    canPartCancel: boolean;
    acquCardCode: string;
    acquCardName: string;
  };
}

interface Delivery {
  recipient: string;
  contactNumber1: string;
  contactNumber2: string;
  postalCode: string;
  address: string;
  detailedAddress: string;
}

interface ItemInfo {
  id: number;
  name: string;
  price: number;
  shortDescription: string;
  landingPageDescription: string;
  status: 'PRIVATE' | 'PUBLIC';
  titleImageUrl: string;
  imageUrls: string[];
}

interface OrderInfo {
  id: number;
  approveResult: PaymentApproveResult;
  deliveryInfo: Delivery;
  status: 'PAYMENT_CHECKING' | 'PREPARING_PRODUCT' | 'MAKING_PRODUCT' | 'PREPARING_DELIVERY' | 'SHIPPING' | 'DELIVERED' | 'CANCELED';
  createAt: string;
  updatedAt: string;
  items: ItemInfo[];
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'ID' | 'STATUS' | 'CREATE_DATE' | 'UPDATE_DATE' | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'id' | 'createAt' | 'updatedAt' | 'status' | 'amount'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    orderId: 0,
    recipient: '',
    contactNumber1: '',
    contactNumber2: '',
    postalCode: '',
    address: '',
    detailedAddress: '',
    buyerName: '',
    buyerTel: '',
    buyerEmail: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<OrderInfo[]>('/admin/order');
      console.log('주문 API 응답:', response.data);
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (err: any) {
      setError('주문 목록을 불러오는데 실패했습니다.');
      console.error('주문 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 정렬 필터링
  useEffect(() => {
    let filtered = orders;
    
    // 주문 상태 매핑 (영문 -> 한글)
    const statusMapping: { [key: string]: string } = {
      'PAYMENT_CHECKING': '결제 확인',
      'PREPARING_PRODUCT': '제작 준비중',
      'MAKING_PRODUCT': '제작 중',
      'PREPARING_DELIVERY': '배송 준비중',
      'SHIPPING': '배송중',
      'DELIVERED': '배송완료',
      'CANCELED': '취소됨'
    };
    
    // 검색 필터링
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = orders.filter(order => {
        switch (searchType) {
          case 'ID':
            return order.id.toString().includes(keyword);
          case 'STATUS':
            const statusLower = order.status.toLowerCase();
            const statusKorean = statusMapping[order.status] || order.status;
            return statusLower.includes(keyword) || statusKorean.toLowerCase().includes(keyword);
          case 'CREATE_DATE':
            return order.createAt.includes(keyword);
          case 'UPDATE_DATE':
            return order.updatedAt.includes(keyword);
          case 'ALL':
            return (
              order.id.toString().includes(keyword) ||
              order.status.toLowerCase().includes(keyword) ||
              (statusMapping[order.status] && statusMapping[order.status].toLowerCase().includes(keyword)) ||
              order.createAt.includes(keyword) ||
              order.updatedAt.includes(keyword) ||
              order.approveResult.buyerName.toLowerCase().includes(keyword) ||
              order.approveResult.buyerEmail.toLowerCase().includes(keyword) ||
              order.deliveryInfo.recipient.toLowerCase().includes(keyword) ||
              order.deliveryInfo.address.toLowerCase().includes(keyword)
            );
          default:
            return true;
        }
      });
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      if (sortField === 'amount') {
        aValue = a.approveResult.amount || 0;
        bValue = b.approveResult.amount || 0;
      } else if (sortField === 'createAt') {
        aValue = new Date(a.createAt).getTime();
        bValue = new Date(b.createAt).getTime();
      } else if (sortField === 'updatedAt') {
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
      } else if (sortField === 'status') {
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
      } else if (sortField === 'id') {
        aValue = a.id || 0;
        bValue = b.id || 0;
      } else {
        aValue = 0;
        bValue = 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredOrders(filtered);
  }, [searchKeyword, searchType, orders, sortField, sortDirection]);

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm(`정말 주문 #${orderId}을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setDeleteLoading(orderId);
      await api.delete(`/admin/order?orderId=${orderId}`);
      alert('주문이 삭제되었습니다.');
      fetchOrders(); // 목록 새로고침
    } catch (err: any) {
      alert(err.response?.data?.message || '주문 삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSort = (field: 'id' | 'createAt' | 'updatedAt' | 'status' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: 'id' | 'createAt' | 'updatedAt' | 'status' | 'amount') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: { bg: string; color: string; text: string } } = {
      'PAYMENT_CHECKING': { bg: '#fff3cd', color: '#856404', text: '결제 확인' },
      'PREPARING_PRODUCT': { bg: '#d1ecf1', color: '#0c5460', text: '제작 준비중' },
      'MAKING_PRODUCT': { bg: '#d4edda', color: '#155724', text: '제작 중' },
      'PREPARING_DELIVERY': { bg: '#cce5ff', color: '#004085', text: '배송 준비중' },
      'SHIPPING': { bg: '#e2e3e5', color: '#383d41', text: '배송중' },
      'DELIVERED': { bg: '#d4edda', color: '#155724', text: '배송완료' },
      'CANCELED': { bg: '#f8d7da', color: '#721c24', text: '취소됨' }
    };

    const style = statusColors[status] || { bg: '#f5f5f5', color: '#666', text: status };

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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch (error) {
      return null;
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '0원';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const handleShowPaymentDetail = (order: OrderInfo) => {
    setSelectedOrder(order);
    setEditForm({
      orderId: order.id,
      recipient: order.deliveryInfo?.recipient || '',
      contactNumber1: order.deliveryInfo?.contactNumber1 || '',
      contactNumber2: order.deliveryInfo?.contactNumber2 || '',
      postalCode: order.deliveryInfo?.postalCode || '',
      address: order.deliveryInfo?.address || '',
      detailedAddress: order.deliveryInfo?.detailedAddress || '',
      buyerName: order.approveResult?.buyerName || '',
      buyerTel: order.approveResult?.buyerTel || '',
      buyerEmail: order.approveResult?.buyerEmail || ''
    });
    setIsEditing(false);
    setShowPaymentModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder) return;
    
    try {
      const requestData = {
        orderId: editForm.orderId,
        approveResult: {
          ...selectedOrder.approveResult,
          buyerName: editForm.buyerName,
          buyerTel: editForm.buyerTel,
          buyerEmail: editForm.buyerEmail
        },
        deliveryInfo: {
          recipient: editForm.recipient,
          contactNumber1: editForm.contactNumber1,
          contactNumber2: editForm.contactNumber2,
          postalCode: editForm.postalCode,
          address: editForm.address,
          detailedAddress: editForm.detailedAddress
        }
      };

      await api.put('/admin/order', requestData);
      alert('주문 정보가 수정되었습니다.');
      setIsEditing(false);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || '주문 수정에 실패했습니다.');
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 원래 데이터로 복원
    if (selectedOrder) {
      setEditForm({
        orderId: selectedOrder.id,
        recipient: selectedOrder.deliveryInfo?.recipient || '',
        contactNumber1: selectedOrder.deliveryInfo?.contactNumber1 || '',
        contactNumber2: selectedOrder.deliveryInfo?.contactNumber2 || '',
        postalCode: selectedOrder.deliveryInfo?.postalCode || '',
        address: selectedOrder.deliveryInfo?.address || '',
        detailedAddress: selectedOrder.deliveryInfo?.detailedAddress || '',
        buyerName: selectedOrder.approveResult?.buyerName || '',
        buyerTel: selectedOrder.approveResult?.buyerTel || '',
        buyerEmail: selectedOrder.approveResult?.buyerEmail || ''
      });
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24, textAlign: 'center' }}>
        <div>주문 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '50px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>주문 내역 관리</h1>
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
              주문 목록 ({filteredOrders.length}건 / 전체 {orders.length}건)
            </h2>
            <button
              onClick={fetchOrders}
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
                onChange={(e) => setSearchType(e.target.value as 'ID' | 'STATUS' | 'CREATE_DATE' | 'UPDATE_DATE' | 'ALL')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
              >
                <option value="ID">주문 ID</option>
                <option value="STATUS">주문 상태</option>
                <option value="CREATE_DATE">생성일</option>
                <option value="UPDATE_DATE">수정일</option>
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

        {filteredOrders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666' }}>
            {orders.length === 0 ? '등록된 주문이 없습니다.' : '검색 조건에 맞는 주문이 없습니다.'}
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
                    주문 ID {getSortIcon('id')}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    주문자
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('amount')}
                  >
                    총액 {getSortIcon('amount')}
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('status')}
                  >
                    상태 {getSortIcon('status')}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    상품
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    배송지
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('createAt')}
                  >
                    생성일 {getSortIcon('createAt')}
                  </th>
                  <th 
                    style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => handleSort('updatedAt')}
                  >
                    수정일 {getSortIcon('updatedAt')}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>
                      #{order.id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{order.approveResult?.buyerName || '정보 없음'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{order.approveResult?.buyerEmail || '정보 없음'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{order.approveResult?.buyerTel || '정보 없음'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 'bold' }}>
                      {formatPrice(order.approveResult?.amount || 0)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {getStatusBadge(order.status || 'UNKNOWN')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      <div>
                        {order.items?.map((item, index) => (
                          <div key={item.id} style={{ marginBottom: index < (order.items?.length || 0) - 1 ? 4 : 0 }}>
                            <div style={{ fontWeight: 'bold' }}>{item.name || '상품명 없음'}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{formatPrice(item.price || 0)}</div>
                          </div>
                        )) || '상품 정보 없음'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{order.deliveryInfo?.recipient || '수령인 정보 없음'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {order.deliveryInfo?.address || '주소 정보 없음'}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {order.deliveryInfo?.contactNumber1 || '연락처 정보 없음'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {formatDate(order.createAt) || '날짜 정보 없음'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {formatDate(order.updatedAt) || '날짜 정보 없음'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => handleShowPaymentDetail(order)}
                          style={{
                            padding: '4px 8px',
                            background: '#17a2b8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                        >
                          결제정보
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deleteLoading === order.id}
                          style={{
                            padding: '4px 8px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 11,
                            opacity: deleteLoading === order.id ? 0.6 : 1
                          }}
                        >
                          {deleteLoading === order.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 결제 정보 상세 모달 */}
      {showPaymentModal && selectedOrder && (
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
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#333' }}>결제 정보 상세</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    수정
                  </button>
                )}
                <button
                  onClick={() => setShowPaymentModal(false)}
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
            </div>
            
            {!isEditing ? (
              // 읽기 전용 모드
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h4 style={{ marginBottom: 8, color: '#333' }}>기본 정보</h4>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>결제 상태:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.status || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>결제 방법:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.payMethod || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>결제 금액:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {formatPrice(selectedOrder.approveResult?.amount)}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>승인 번호:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.approveNo || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>TID:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.tid || '정보 없음'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ marginBottom: 8, color: '#333' }}>주문자 정보</h4>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>주문자명:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.buyerName || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>이메일:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.buyerEmail || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>연락처:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.buyerTel || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>결제일시:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.paidAt ? formatDate(selectedOrder.approveResult.paidAt) : '-'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>상품명:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.approveResult?.goodsName || '정보 없음'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8, color: '#333' }}>배송지 정보</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>수령인:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.recipient || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>연락처 1:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.contactNumber1 || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>연락처 2:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.contactNumber2 || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>우편번호:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.postalCode || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>주소:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.address || '정보 없음'}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 'bold' }}>상세주소:</label>
                      <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                        {selectedOrder.deliveryInfo?.detailedAddress || '정보 없음'}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.approveResult.card && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 8, color: '#333' }}>카드 정보</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontWeight: 'bold' }}>카드명:</label>
                        <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                          {selectedOrder.approveResult.card?.cardName || '정보 없음'}
                        </div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontWeight: 'bold' }}>할부:</label>
                        <div style={{ padding: 4, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                          {selectedOrder.approveResult.card?.cardQuota || 0}개월
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 수정 모드
              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h4 style={{ marginBottom: 8, color: '#333' }}>주문자 정보</h4>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>주문자명</label>
                      <input
                        type="text"
                        value={editForm.buyerName}
                        onChange={(e) => setEditForm({...editForm, buyerName: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>이메일</label>
                      <input
                        type="email"
                        value={editForm.buyerEmail}
                        onChange={(e) => setEditForm({...editForm, buyerEmail: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>연락처</label>
                      <input
                        type="text"
                        value={editForm.buyerTel}
                        onChange={(e) => setEditForm({...editForm, buyerTel: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: 8, color: '#333' }}>배송지 정보</h4>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>수령인</label>
                      <input
                        type="text"
                        value={editForm.recipient}
                        onChange={(e) => setEditForm({...editForm, recipient: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>연락처 1</label>
                      <input
                        type="text"
                        value={editForm.contactNumber1}
                        onChange={(e) => setEditForm({...editForm, contactNumber1: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>연락처 2</label>
                      <input
                        type="text"
                        value={editForm.contactNumber2}
                        onChange={(e) => setEditForm({...editForm, contactNumber2: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8, color: '#333' }}>주소 정보</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>우편번호</label>
                      <input
                        type="text"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({...editForm, postalCode: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>주소</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 8, gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>상세주소</label>
                      <input
                        type="text"
                        value={editForm.detailedAddress}
                        onChange={(e) => setEditForm({...editForm, detailedAddress: e.target.value})}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
            
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    onClick={handleEditSubmit}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPaymentModal(false)}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement; 