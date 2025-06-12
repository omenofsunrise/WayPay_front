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

const InvestorReportPage = () => {
    const { getInvestors, currentInvestor, getInvestorById, getInvestorReport } = useInvestor();
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
    const [report, setReport] = useState<InvestorReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchInvestors = async () => {
            setIsLoading(true);
            try {
                const result = await getInvestors();
                if (result?.items) {
                    setInvestors(result.items);
                    // Находим первого инвестора с isCompany: true
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
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReportData();
        }
    }, [selectedInvestorId, getInvestorById, getInvestorReport]);

    const handleInvestorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedInvestorId(e.target.value);
    };

    const investorOptions = investors.map(investor => ({
        value: investor.id.toString(),
        label: investor.nickname || `Investor ${investor.id}`
    }));

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
                    <InvestorName>
                        {report?.fullName || 'Выберите инвестора'}
                    </InvestorName>
                    
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
                </InvestorInfoContainer>
                <ModalInfoTitle>Общие данные</ModalInfoTitle>
                {report && (
                    <ReportDataContainer>
                        <ReportCard>
                            <IconContainer>
                                <Icon src={investmentSvg} alt="Investment" />
                            </IconContainer>
                            <ReportValue>{formatMoney(report.investment.toString())}</ReportValue>
                            <ReportLabel>Инвестиции</ReportLabel>
                        </ReportCard>

                        <ReportCard>
                            <IconContainer>
                                <Icon src={activeCreditsSvg} alt="Active credits" />
                            </IconContainer>
                            <ReportValue>{report.activeCreditsAmount}</ReportValue>
                            <ReportLabel>Незакрытые договоры</ReportLabel>
                        </ReportCard>

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

                        <ReportCard>
                            <IconContainer>
                                <Icon src={report.isCompany ? commonIncomeSvg : selfIncomeSvg} alt="Type" />
                            </IconContainer>
                            <ReportValue>{formatMoney((report.investorIncome + report.selfIncome).toString())}</ReportValue>
                            <ReportLabel>Общий доход</ReportLabel>
                        </ReportCard>

                        <ReportCard>
                            <IconContainer>
                                <Icon src={balanceSvg} alt="Balance" />
                            </IconContainer>
                            <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
                            <ReportLabel>Текущий баланс</ReportLabel>
                        </ReportCard>
                    </ReportDataContainer>
                )}
                <ModalInfoTitle style={{marginTop: "30px" }}>Общие данные</ModalInfoTitle>
                <CustomTable 
                    columns={[
                            { name: "Дата выплаты", isSortable: true },
                            { name: "Выплатил", align: "left" },
                            { name: "Выплата, руб", isSortable: true, align: "left" },
                        ]} 
                    data={tableData}
                />
            </ContentContainer>
        </PageLayout>
    );
};

const tableData = [
    ["10.05.2023", "Моковые данные!", "25 000 ₽"],
];

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
    margin-left: auto;
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