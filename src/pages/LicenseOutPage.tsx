import React from 'react';
import { 
  Typography,
  Box,
  Button,
  Divider
} from '@mui/material';
import styled from "styled-components";
import { useNavigate } from 'react-router-dom';
import PhoneLink from '../components/ui/links/PhoneLink';

const LicenseContainer = styled.div`
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
`;

const LicenseContent = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 500px;
  text-align: center;
`;

const LicenseImage = styled.img`
  width: 150px;
  height: 150px;
  margin-bottom: 24px;
  opacity: 0.8;
`;

const LicenseOutPage = () => {
  const navigate = useNavigate();

  return (
    <LicenseContainer>
      <LicenseContent>
        <LicenseImage src="/licence-out.svg" alt="License expired" />
        <Typography variant="h4" component="div" sx={{ 
          fontWeight: 'bold', 
          marginBottom: 2,
          color: '#007D88'
        }}>
          Лицензия истекла
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body1" sx={{ 
          marginBottom: 3,
          color: '#555'
        }}>
          Срок действия лицензии вашей компании истек. Для продолжения работы с системой необходимо продлить лицензию.
        </Typography>
        
        <Typography variant="caption" sx={{ 
          display: 'block',
          marginTop: 3,
          color: '#888'
        }}>
          По вопросам продления лицензии обращайтесь по номеру{' '}
          <PhoneLink href="tel:89899242424">
            8 (989) 924-24-24
          </PhoneLink>
        </Typography>
      </LicenseContent>
    </LicenseContainer>
  );
};

export default LicenseOutPage;
