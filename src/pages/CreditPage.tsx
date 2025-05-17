import React from 'react';
import { Navigate } from 'react-router-dom';

const CreditPage: React.FC = () => {
  // Проверяем наличие токена в localStorage
  const isAuthenticated = !!localStorage.getItem('accessToken');

  // Если нет токена - перенаправляем на страницу авторизации
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Основной контент страницы
  return (
    <div className="credit-page">
      <h1>Кредитная информация</h1>
      <div className="credit-content">
        <p>Здесь будет информация о кредитах и займах</p>
        <div className="credit-card">
          <h3>Ваш кредитный рейтинг</h3>
          <p>850 баллов (отлично)</p>
        </div>
      </div>
    </div>
  );
};

export default CreditPage;