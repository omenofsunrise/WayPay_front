import React from 'react';

interface TitlesColumnProps {
  children: React.ReactNode;
}

export const TitlesColumn: React.FC<TitlesColumnProps> = ({ children }) => {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateRows: 'repeat(auto-fill, 40px)', // Фиксированная высота строк
      gap: '15px',
      alignItems: 'center' // Выравнивание по центру вертикально
    }}>
      {children}
    </div>
  );
};