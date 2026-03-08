import React, { useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import useSchedule from '../../../api/hooks/useSchedule';
import styled from 'styled-components';
import CustomTable, { type Column } from '../../ui/tables/CustomTable';

interface CreditBriefModalProps {
    onClose: () => void;
    creditId: number;
}

const CreditBriefModal: React.FC<CreditBriefModalProps> = ({
    onClose,
    creditId,
}) => {
    const { 
        scheduleData, 
        getByCreditId,
        isLoading,
    } = useSchedule();

    useEffect(() => {
        if (creditId) {
            getByCreditId(creditId, { includePayed: true });
        }
    }, [creditId, getByCreditId]);

    const tableData = scheduleData?.items.map(item => {
        let comment = item.comment;
        if (item.payed) {
            comment = ' ОПЛАЧЕНО';
        }

        return [
            new Date(item.paymentDate).toLocaleDateString('ru-RU'),
            `${item.paymentAmount.toLocaleString('ru-RU')}`,
            comment
        ];
    }) || [];

    const getRowStyles = () => {
        const styles: { [key: number]: any } = {};
        
        scheduleData?.items.forEach((item, index) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const paymentDate = new Date(item.paymentDate);
            paymentDate.setHours(0, 0, 0, 0);
            
            if (!item.payed && paymentDate < today) {
                styles[index] = {
                    backgroundColor: '#FFF3E0',
                    color: '#D97706',
                };
            }
            if (item.payed) {
                styles[index] = {
                    backgroundColor: '#E6F7E6',
                    color: '#059669',
                };
            }
        });
        
        return styles;
    };

    return (
        <BaseModal
            title={`Договор №${scheduleData?.items[0]?.creditId || creditId}`}
            onClose={onClose}
            onCancel={onClose}
            hideSaveButton={true}
        >
            <ModalContent>
                {isLoading ? (
                    <LoadingContainer>Загрузка данных...</LoadingContainer>
                ) : !scheduleData?.items.length ? (
                    <EmptyContainer>Нет данных по расписанию платежей</EmptyContainer>
                ) : (
                    <>
                            <CustomTable
                                columns={[
                                    { name: "Дата", },
                                    { name: "Сумма", align: "right" },
                                    { name: "Примечание", align: "center" },
                                ]} 
                                data={tableData}
                                rowStyles={getRowStyles()}
                                isLoading={isLoading}
                                multiSelect={false}
                                hasTotalsRow={false}
                            />
                    </>
                )}
            </ModalContent>
        </BaseModal>
    );
};

const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 500px;
`;

const SummaryInfo = styled.div`
    display: flex;
    gap: 24px;
    padding: 16px;
    background-color: #F9FAFB;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
`;

const SummaryItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Label = styled.span`
    font-size: 12px;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Value = styled.span`
    font-size: 20px;
    font-weight: 600;
    color: #111827;
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 500px;
    font-size: 16px;
    color: #6B7280;
`;

const EmptyContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 500px;
    font-size: 16px;
    color: #6B7280;
    background-color: #F9FAFB;
    border-radius: 8px;
    border: 1px dashed #D1D5DB;
`;

export default CreditBriefModal;