import React from 'react';
import styled from 'styled-components';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Container>
      <Content>
        <Title>Политика конфиденциальности</Title>
        
        <Section>
          <SectionTitle>1. Общие положения</SectionTitle>
          <SectionText>
            Настоящая Политика конфиденциальности персональных данных (далее - Политика конфиденциальности) действует в отношении всей информации, которую приложение может получить о пользователе во время использования.
          </SectionText>
        </Section>
        
        <Section>
          <SectionTitle>2. Персональные данные пользователей</SectionTitle>
          <SectionText>
            Приложение может собирать и обрабатывать следующие персональные данные: имя, контактные данные (телефон, email), технические данные устройства (модель, версия ОС).
          </SectionText>
        </Section>
        
        <Section>
          <SectionTitle>3. Цели сбора персональных данных</SectionTitle>
          <SectionText>
            Персональные данные собираются для: предоставления услуг, улучшения качества работы приложения, связи с пользователем.
          </SectionText>
        </Section>
        
        <Section>
          <SectionTitle>4. Условия обработки персональных данных</SectionTitle>
          <SectionText>
            Обработка персональных данных осуществляется с согласия пользователя. Приложение принимает необходимые меры для защиты персональных данных.
          </SectionText>
        </Section>
        
        <Section>
          <SectionTitle>5. Контактная информация</SectionTitle>
          <SectionText>
            По вопросам, связанным с политикой конфиденциальности, вы можете обратиться по телефону: 8 (995) 702-23-04 (Элипханов Ибрахим Султанович).
          </SectionText>
        </Section>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
`;

const Content = styled.div`
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #333;
  font-size: 24px;
  margin-bottom: 30px;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 25px;
`;

const SectionTitle = styled.h2`
  color: #444;
  font-size: 18px;
  margin-bottom: 10px;
`;

const SectionText = styled.p`
  color: #555;
  line-height: 1.5;
  text-align: justify;
`;

export default PrivacyPolicyPage;