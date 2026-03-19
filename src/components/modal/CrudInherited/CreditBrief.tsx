import React, { useEffect } from 'react';
import BaseModal from '../BASE/modalCRUBase';
import useSchedule from '../../../api/hooks/useSchedule';
import styled from 'styled-components';
import CustomTable from '../../ui/tables/CustomTable';
import Portal from '../../../utils/Portal';

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const paymentDate = new Date(item.paymentDate);
        paymentDate.setHours(0, 0, 0, 0);
            
        let status = "";
        if (item.payed) {
            status = 'ОПЛАЧЕНО';
        } else if (paymentDate < today) {
            status = 'ПРОСРОЧЕНО';
        } else {
            status = 'Ожидается'
        }

        return [
            new Date(item.paymentDate).toLocaleDateString('ru-RU'),
            item.comment,
            status,
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

    const modalContent = (
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
                                { name: "Дата" },
                                { name: "Платёж", align: "center" },
                                { name: "Статус", align: "center" },
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

    return <Portal>{modalContent}</Portal>;
};

const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 500px;
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