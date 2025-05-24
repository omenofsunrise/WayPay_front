import React from 'react';

interface InputsColumnProps {
  children: React.ReactNode;
}

export const InputsColumn: React.FC<InputsColumnProps> = ({ children }) => {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateRows: 'repeat(auto-fill, 40px)', // Такая же высота строк
      gap: '15px',
      alignItems: 'center' // Выравнивание по центру вертикально
    }}>
      {children}
    </div>
  );
};