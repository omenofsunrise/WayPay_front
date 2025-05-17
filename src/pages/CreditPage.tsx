import React from 'react';
import { Navigate } from 'react-router-dom';

interface CreditPageProps {
  onLogout: () => void;
}

const CreditPage: React.FC<CreditPageProps> = ({ onLogout }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="credit-page">
      <h1>Кредиты</h1>
      <button onClick={onLogout}>Выйти</button>
    </div>
  );
};

export default CreditPage;