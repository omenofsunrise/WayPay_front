import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import useCredit from '../../../api/hooks/useCredit';
import type { CreditListResponse } from '../../../api/types/credit';
import type { PaginatedResponse } from '../../../api/types/common';

interface SelectCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creditId: number) => void;
  clientId?: number;
}

const SelectCreditModal: React.FC<SelectCreditModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  clientId
}) => {
  const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null);
  const [credits, setCredits] = useState<PaginatedResponse<CreditListResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getCreditListByClient } = useCredit();

  useEffect(() => {
    if (isOpen && clientId) {
      fetchCredits();
    }
  }, [isOpen, clientId]);

  const fetchCredits = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    try {
      const creditData = await getCreditListByClient(clientId);
      setCredits(creditData);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditSelect = (creditId: number) => {
    setSelectedCreditId(creditId);
  };

  const handleConfirm = () => {
    if (selectedCreditId) {
      onSelect(selectedCreditId);
      onClose();
      setSelectedCreditId(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCreditId(null);
  };

  const getStatusStyles = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'активный') {
      return {
        bgcolor: 'transparent',
        color: 'common.black',
        borderColor: 'rgba(0, 0, 0, 0.23)'
      };
    } else if (statusLower === 'просроченный') {
      return {
        bgcolor: 'rgba(232, 216, 216, 1)',
        color: 'common.black',
        borderColor: 'rgba(232, 216, 216, 1)'
      };
    } else if (statusLower === 'закрытый') {
      return {
        bgcolor: '#E8F5E8',
        color: '#1B5E20',
        borderColor: '#E8F5E8'
      };
    }
    
    return {
      bgcolor: 'transparent',
      color: 'common.black',
      borderColor: 'rgba(0, 0, 0, 0.23)'
    };
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'активный':
        return 'Активный';
      case 'просроченный':
        return 'Просроченный';
      case 'закрытый':
        return 'Закрытый';
      default:
        return status;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Выберите договор для заметки
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : credits && credits.items && credits.items.length > 0 ? (
          <List>
            {credits.items.map((credit) => {
              const statusStyles = getStatusStyles(credit.status);
              const isSelected = selectedCreditId === credit.id;
              
              return (
                <ListItem
                  key={credit.id}
                  onClick={() => handleCreditSelect(credit.id)}
                  sx={{
                    margin: "10px 0",
                    boxShadow: "2px 2px 4px 2px rgba(0, 8, 9, 0.08)",
                    borderRadius: "10px",
                    backgroundColor: isSelected ? 'rgba(89, 212, 188, 0.1)' : `${statusStyles.bgcolor}`,
                    padding: "10px 16px",
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: isSelected ? '2px solid rgba(89, 212, 188, 1)' : `2px solid ${statusStyles.borderColor}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '4px 4px 8px 3px rgba(0, 8, 9, 0.12)',
                      backgroundColor: isSelected ? 'rgba(89, 212, 188, 0.15)' : 'rgba(0, 125, 136, 0.05)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" sx={{ bgcolor: 'rgba(0, 125, 136, 0.3)' }}>
                        <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="33" height="33" rx="10" fill="#C0DBE0"/>
                            <path d="M14.1333 7.125H11.8125C11.1909 7.125 10.5948 7.37193 10.1552 7.81147C9.71568 8.25101 9.46875 8.84715 9.46875 9.46875V23.5312C9.46875 24.1529 9.71568 24.749 10.1552 25.1885C10.5948 25.6281 11.1909 25.875 11.8125 25.875H21.1875C21.8091 25.875 22.4052 25.6281 22.8448 25.1885C23.2843 24.749 23.5312 24.1529 23.5312 23.5312V16.5M14.1333 7.125C15.4281 7.125 16.5 8.17396 16.5 9.46875V11.8125C16.5 12.4341 16.7469 13.0302 17.1865 13.4698C17.626 13.9093 18.2221 14.1562 18.8437 14.1562H21.1875C21.8091 14.1562 22.4052 14.4032 22.8448 14.8427C23.2843 15.2823 23.5312 15.8784 23.5312 16.5M14.1333 7.125C17.9771 7.125 23.5312 12.7083 23.5312 16.5" stroke="#007D88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          Договор №{credit.id}
                        </Typography>
                        <Chip
                          label={getStatusText(credit.status)}
                          size="small"
                          sx={{
                            backgroundColor: statusStyles.bgcolor,
                            color: statusStyles.color,
                            border: `1px solid ${statusStyles.borderColor}`,
                            fontSize: '0.75rem',
                            height: '24px'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Дата: {format(new Date(credit.creditDate), 'dd.MM.yyyy')}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
            <Typography variant="body1" color="text.secondary">
              {clientId ? 'Нет доступных договоров' : 'Клиент не выбран'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ padding: 3 }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedCreditId}
          variant="contained"
          sx={{
            backgroundColor: 'rgba(89, 212, 188, 1)',
            color: 'common.black',
            '&:hover': {
              backgroundColor: 'rgba(89, 212, 188, 0.8)'
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          Выбрать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectCreditModal;