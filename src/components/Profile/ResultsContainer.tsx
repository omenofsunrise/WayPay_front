import React from 'react';
import styled from 'styled-components';

interface ResultsContainerProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  percentageChange: {
    value: number;
    hasChange: boolean;
    isPositive: boolean;
    isNeutral?: boolean;
  };
}

const ResultsContainer: React.FC<ResultsContainerProps> = ({
  icon,
  title,
  value,
  percentageChange,
}) => {
  const absolutePercentage = Math.abs(percentageChange.value);

  return (
    <Container>
      <Header>
        <IconWrapper>{icon}</IconWrapper>
        <Title>{title}</Title>
      </Header>
      
      <Content>
        <Value>{value}</Value>
        
        <ChangeIndicator>
          {percentageChange.hasChange ? (
            <>
              {!percentageChange.isNeutral && (
                percentageChange.isPositive ? (
                  <ArrowIcon viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.24991 6.91659H8.74991C8.82585 6.91635 8.90028 6.89541 8.96519 6.85601C9.03011 6.81662 9.08306 6.76027 9.11833 6.69303C9.1536 6.62578 9.16987 6.55019 9.16537 6.47439C9.16088 6.39859 9.1358 6.32545 9.09283 6.26284L5.34283 0.846172C5.18741 0.621589 4.81325 0.621589 4.65741 0.846172L0.907414 6.26284C0.864007 6.32531 0.838553 6.39849 0.833816 6.47442C0.829079 6.55035 0.84524 6.62612 0.880544 6.69351C0.915849 6.7609 0.968945 6.81732 1.03407 6.85665C1.09919 6.89598 1.17384 6.91671 1.24991 6.91659Z" fill="#007D88"/>
                  </ArrowIcon>
                ) : (
                  <ArrowIcon viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.24991 0.083252H8.74991C8.82585 0.0834979 8.90028 0.104433 8.96519 0.143826C9.03011 0.183219 9.08306 0.239571 9.11833 0.306816C9.1536 0.374061 9.16987 0.449653 9.16537 0.525453C9.16088 0.601253 9.1358 0.674393 9.09283 0.737002L5.34283 6.15367C5.18741 6.37825 4.81325 6.37825 4.65741 6.15367L0.907414 0.737002C0.864007 0.674531 0.838553 0.601353 0.833816 0.525423C0.829079 0.449493 0.84524 0.373725 0.880544 0.306332C0.915849 0.238939 0.968945 0.182523 1.03407 0.143191C1.09919 0.103859 1.17384 0.0831308 1.24991 0.083252Z" fill="#FF5A5A"/>
                  </ArrowIcon>
                )
              )}
              <ChangeText 
                $isPositive={percentageChange.isPositive} 
                $isNeutral={percentageChange.isNeutral}
              >
                {percentageChange.isNeutral ? (
                  `Столько же сколько в прошлом месяце`
                ) : (
                  `на ${absolutePercentage}% ${percentageChange.isPositive ? 'больше' : 'меньше'}, чем в прошлом месяце`
                )}
              </ChangeText>
            </>
          ) : (
            <ChangeText $isPositive={false} $isNeutral>
              Отсутствует активность
            </ChangeText>
          )}
        </ChangeIndicator>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  border: 1px solid rgba(209, 213, 219, 1);
  border-radius: 0.5rem;
  padding: 2.5rem;
  width: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const IconWrapper = styled.div`
  margin-right: 0.5rem;
`;

const Title = styled.span`
  color: rgb(75, 85, 99);
  font-size: 0.875rem;
  line-height: 1.25rem;
`;

const Content = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline; /* Изменено с flex-end на baseline */
`;

const Value = styled.span`
  color: black;
  font-size: 1.875rem;
  font-weight: 500;
  white-space: nowrap;
  line-height: 2.25rem;
`;

const ChangeIndicator = styled.div`
  display: flex;
  align-items: center;
  height: 50px;
  width: 170px;
`;

const ArrowIcon = styled.svg`
  width: 15px;
  height: 13px;
  display: block;
`;

const ChangeText = styled.span<{ $isPositive: boolean; $isNeutral?: boolean }>`
  font-size: 0.875rem;
  margin-left: ${props => props.$isNeutral ? '0' : '0.25rem'};
  color: ${props => 
    props.$isNeutral ? 'rgb(75, 85, 99)' :
    props.$isPositive ? 'rgb(0, 125, 136)' : 'rgb(255, 90, 90)'
  };
  line-height: 1.25rem;
`;


export default ResultsContainer;