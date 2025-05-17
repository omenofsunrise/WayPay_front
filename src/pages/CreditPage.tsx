import styled from 'styled-components';

const PageContainer = styled.div`
  max-height: calc(100vh - 60px - 40px); // Высота экрана минус верхнее меню и padding
  overflow-y: auto;
`;

interface CreditPageProps {
  onLogout: () => void;
}

const CreditPage = ({ onLogout }: CreditPageProps) => {
  return (
    <PageContainer>
      {/* Твой контент страницы */}
      <h1>Кредиты</h1>
      <button onClick={onLogout}>Выйти</button>
      {/* Остальной контент */}
    </PageContainer>
  );
};

export default CreditPage;