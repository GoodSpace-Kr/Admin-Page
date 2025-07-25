import React, { useState, useEffect } from 'react';
import Login from './Login';
import Main from './Main';
import ClientManagement from './ClientManagement';
import ClientCreate from './ClientCreate';
import ClientEdit from './ClientEdit';
import ItemManagement from './ItemManagement';
import ItemAdd from './ItemAdd';
import ItemEdit from './ItemEdit';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwt'));

  // localStorage 변경 감지
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('jwt'));
    };

    // 초기 상태 설정
    checkLoginStatus();

    // storage 이벤트 리스너 추가 (다른 탭에서의 변경 감지)
    window.addEventListener('storage', checkLoginStatus);

    // 커스텀 이벤트 리스너 추가 (같은 탭에서의 변경 감지)
    window.addEventListener('loginStatusChanged', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('loginStatusChanged', checkLoginStatus);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={isLoggedIn ? <Main /> : <Navigate to="/login" />} />
        <Route path="/clients" element={isLoggedIn ? <ClientManagement /> : <Navigate to="/login" />} />
        <Route path="/client/create" element={isLoggedIn ? <ClientCreate /> : <Navigate to="/login" />} />
        <Route path="/client/edit/:clientId" element={isLoggedIn ? <ClientEdit /> : <Navigate to="/login" />} />
        <Route path="/client/:clientId/items" element={isLoggedIn ? <ItemManagement /> : <Navigate to="/login" />} />
        <Route path="/client/:clientId/items/add" element={isLoggedIn ? <ItemAdd /> : <Navigate to="/login" />} />
        <Route path="/client/:clientId/items/:itemId/edit" element={isLoggedIn ? <ItemEdit /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
