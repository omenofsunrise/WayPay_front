import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ExportButton from "../components/ui/Buttons/ExportButton";
import PageLayout from "../components/ui/Layouts/PageLayout"
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from '../api/types/investor';
import useInvestor from '../api/hooks/useInvestor';
import CustomSelect from '../components/ui/fields/CustomSelect';
import { formatDate } from '../utils/dateFormatter';
import { formatMoney } from '../utils/formatPrice';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import investmentSvg from '../assets/ui/InvestorReport/investment.svg';
import activeCreditsSvg from '../assets/ui/InvestorReport/credits.svg';
import investorIncomeScg from '../assets/ui/InvestorReport/investorIncome.svg'; 
import selfIncomeSvg from '../assets/ui/InvestorReport/selfIncome.svg';
import commonIncomeSvg from '../assets/ui/InvestorReport/commonIncome.svg';
import balanceSvg from '../assets/ui/InvestorReport/balance.svg';
import CustomTable from '../components/ui/tables/CustomTable';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import { useInvestorPayout } from '../api/hooks/useInvestorPayout';
import type { InvestorPayout } from '../api/types/investorPayout';
import PayoutModal from '../components/modal/PayoutModal';

const InvestorReportPage = () => {
    const { getInvestors, currentInvestor, getInvestorById, getInvestorReport } = useInvestor();
    const { 
        payouts, 
        isLoading: isPayoutsLoading, 
        fetchPayouts, 
        addPayout, 
        removePayout 
    } = useInvestorPayout();
    
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
    const [report, setReport] = useState<InvestorReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState<string>('');

    useEffect(() => {
        const fetchInvestors = async () => {
            setIsLoading(true);
            try {
                const result = await getInvestors();
                if (result?.items) {
                    setInvestors(result.items);
                    const companyInvestor = result.items.find(investor => investor.isCompany);
                    if (companyInvestor) {
                        setSelectedInvestorId(companyInvestor.id.toString());
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvestors();
    }, [getInvestors]);

    useEffect(() => {
        if (selectedInvestorId) {
            const fetchReportData = async () => {
                setIsLoading(true);
                try {
                    await getInvestorById(Number(selectedInvestorId));
                    const reportData = await getInvestorReport(Number(selectedInvestorId));
                    setReport(reportData);
                    fetchPayouts(Number(selectedInvestorId));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReportData();
        }
    }, [selectedInvestorId]);

    const handleInvestorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedInvestorId(e.target.value);
    };

    const handlePayoutSubmit = async () => {
        if (!selectedInvestorId || !payoutAmount || !currentInvestor || !report) return;
        
        const numericAmount = Number(payoutAmount.replace(/\D/g, ''));
        let maxAllowedAmount = 0;

        if (currentInvestor.isBlocked) {
            maxAllowedAmount = report.balance;
        } else {
            maxAllowedAmount = report.isCompany 
                ? report.investorIncome + report.selfIncome 
                : report.investorIncome;
        }

        if (numericAmount > maxAllowedAmount) {
            alert(`Нельзя выплатить больше чем ${formatMoney(maxAllowedAmount.toString())}`);
            return;
        }

        try {
            await addPayout({
                investorId: Number(selectedInvestorId),
                amount: numericAmount
            });
            setIsPayoutModalOpen(false);
            setPayoutAmount('');
            
            const updatedReport = await getInvestorReport(Number(selectedInvestorId));
            setReport(updatedReport);
        } catch (error) {
            console.error('Payout error:', error);
        }
    };

    const handleDeletePayout = async (id: number) => {
        try {
            await removePayout(id);
            if (selectedInvestorId) {
                const updatedReport = await getInvestorReport(Number(selectedInvestorId));
                setReport(updatedReport);
            }
        } catch (error) {
            console.error('Delete payout error:', error);
        }
    };

    const investorOptions = investors.map(investor => ({
        value: investor.id.toString(),
        label: investor.nickname || `Investor ${investor.id}`
    }));

    const payoutTableData = payouts.map((payout: InvestorPayout) => [
        formatDate(payout.payoutDate),
        payout.employeeFullName,
        formatMoney(payout.amount.toString()),
        <DeleteButton onClick={() => handleDeletePayout(payout.id)}>
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.949286 13.7822C0.949286 14.7298 1.80364 15.505 2.84786 15.505H10.4421C11.4864 15.505 12.3407 14.7298 12.3407 13.7822V3.44556H0.949286V13.7822ZM13.29 0.861389H9.9675L9.01821 0H4.27179L3.3225 0.861389H0V2.58417H13.29V0.861389Z" fill="#50555C"/>
            </svg>
        </DeleteButton>
    ]);

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Отчёт для инвесторов</CustomTitle>
                <ExportButton 
                    onClick={() => {
                        console.log('Export report', report);
                    }} 
                    disabled={!report}
                />
            </TitleField>

            <ContentContainer>
                {report && (
                    <CreationDate>
                        Инвестор создан {formatDate(report.createdAt)}
                    </CreationDate>
                )}

                <InvestorInfoContainer>
                    <SelectWrapper>
                        <CustomSelect
                            value={selectedInvestorId}
                            onChange={handleInvestorChange}
                            options={investorOptions}
                            placeholder="Выберите инвестора"
                            customPlaceholder="Выберите инвестора"
                            disabled={isLoading}
                        />
                    </SelectWrapper>
                    <DarkCyanButton 
                        onClick={() => setIsPayoutModalOpen(true)}
                        style={{marginLeft: "auto"}}
                    >
                        Выплатить инвестору
                    </DarkCyanButton>
                </InvestorInfoContainer>

                <ModalInfoTitle>Общие данные</ModalInfoTitle>
                {report && (
                    <ReportDataContainer>
                        <ReportCard>
                            <IconContainer>
                                <Icon src={investmentSvg} alt="Investment" />
                            </IconContainer>
                            <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
                            <ReportLabel>Инвестиция</ReportLabel>
                        </ReportCard>

                        <ReportCard>
                            <IconContainer>
                                <Icon src={activeCreditsSvg} alt="Active credits" />
                            </IconContainer>
                            <ReportValue>{report.activeCreditsAmount}</ReportValue>
                            <ReportLabel>Незакрытые договоры</ReportLabel>
                        </ReportCard>

                        {report.isCompany ? (
                            <ReportCard>
                                <IconContainer>
                                    <Icon src={commonIncomeSvg} alt="Company income" />
                                </IconContainer>
                                <ReportValue>{formatMoney((report.investorIncome + report.selfIncome).toString())}</ReportValue>
                                <ReportLabel>Доход компании</ReportLabel>
                            </ReportCard>
                        ) : (
                            <>
                                <ReportCard>
                                    <IconContainer>
                                        <Icon src={investorIncomeScg} alt="Investor income" />
                                    </IconContainer>
                                    <ReportValue>{formatMoney(report.investorIncome.toString())}</ReportValue>
                                    <ReportLabel>Доход инвестора</ReportLabel>
                                </ReportCard>

                                <ReportCard>
                                    <IconContainer>
                                        <Icon src={selfIncomeSvg} alt="Self income" />
                                    </IconContainer>
                                    <ReportValue>{formatMoney(report.selfIncome.toString())}</ReportValue>
                                    <ReportLabel>Собственный доход</ReportLabel>
                                </ReportCard>
                            </>
                        )}

                        {!report.isCompany && (
                            <ReportCard>
                                <IconContainer>
                                    <Icon src={commonIncomeSvg} alt="Total income" />
                                </IconContainer>
                                <ReportValue>{formatMoney((report.investorIncome + report.selfIncome).toString())}</ReportValue>
                                <ReportLabel>Общий доход</ReportLabel>
                            </ReportCard>
                        )}

                        <ReportCard>
                            <IconContainer>
                                <Icon src={balanceSvg} alt="Balance" />
                            </IconContainer>
                            <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
                            <ReportLabel>Касса</ReportLabel>
                        </ReportCard>
                    </ReportDataContainer>
                )}

                <ModalInfoTitle style={{marginTop: "30px" }}>История выплат</ModalInfoTitle>
                <CustomTable 
                    columns={[
                        { name: "Дата выплаты", isSortable: true },
                        { name: "Выплатил", align: "left" },
                        { name: "Выплата, руб", isSortable: true, align: "left" },
                        { name: "", align: "center" }
                    ]} 
                    data={payoutTableData}
                    isLoading={isPayoutsLoading}
                />
            </ContentContainer>

            <PayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                amount={payoutAmount}
                onAmountChange={setPayoutAmount}
                onSubmit={handlePayoutSubmit}
                maxAmount={
                    currentInvestor?.isBlocked 
                        ? report?.balance || 0 
                        : report?.isCompany 
                            ? (report?.investorIncome || 0) + (report?.selfIncome || 0)
                            : report?.investorIncome || 0
                }
                isLoading={isPayoutsLoading}
            />
        </PageLayout>
    );
};

const DeleteButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 8px;
    
    &:hover {
        opacity: 0.8;
    }
    
    svg {
        display: block;
    }
`;

const ContentContainer = styled.div`
    margin-top: 0px;
    padding: 0;
`;

const CreationDate = styled.div`
    font-size: 14px;
    color: black;
    font-weight: 400;
    margin-bottom: 24px;
    text-align: left;
    margin-left: 0;
    padding-left: 0;
`;

const InvestorInfoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
`;

const InvestorName = styled.div`
    font-size: 16px;
    font-weight: 500;
    min-width: 200px;
    padding: 0;
    margin: 0;
    text-align: left;
`;

const SelectWrapper = styled.div`
    flex-grow: 1;
    max-width: 300px;
`;

const ReportDataContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    width: 100%;
`;

const ReportCard = styled.div`
    background-color: white;
    border: 1px solid rgba(209, 213, 219, 1);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const IconContainer = styled.div`
    position: absolute;
    top: 25px;
    left: 25px;
`;

const Icon = styled.img`
    width: 50px;
    height: 50px;
`;

const ReportLabel = styled.span`
    font-size: 14px;
    color: black;
    margin: 0px 30px 30px;
    text-align: center;
`;

const ReportValue = styled.span`
    font-size: 20px;
    font-weight: 500;
    color: #111827;
    text-align: center;
    margin: 100px 0 0;
`;

export default InvestorReportPage;