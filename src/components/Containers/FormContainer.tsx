import React from 'react';

interface FormContainerProps {
  children: React.ReactNode;
}

export const FormContainer: React.FC<FormContainerProps> = ({ children }) => {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'auto 1fr', // Две колонки: для заголовков и полей
      gap: '20px',
      padding: '20px',
      alignItems: 'start' // Выравнивание по верху
    }}>
      {children}
    </div>
  );
};