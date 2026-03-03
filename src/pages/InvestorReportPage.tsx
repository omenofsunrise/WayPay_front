
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ExportButton from "../components/ui/Buttons/ExportButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from '../api/types/investor';
import useInvestor from '../api/hooks/useInvestor';
import CustomSelect from '../components/ui/fields/CustomSelect';
import { formatDate } from '../utils/dateFormatter';
import { formatMoney, parseMoney } from '../utils/formatPrice';
import { formatPhoneHref } from '../utils/phoneUtils';
import { PHONE_LINK_COLOR } from '../components/ui/links/PhoneLink';
import ModalInfoTitle from '../components/ui/Text/ModalInfoTitle';
import investmentSvg from '../assets/ui/InvestorReport/investment.svg';
import paymentIncomeSvg from '../assets/ui/InvestorReport/PaymentIncome.svg';
import activeCreditsSvg from '../assets/ui/InvestorReport/credits.svg';
import investorIncomeScg from '../assets/ui/InvestorReport/investorIncome.svg'; 
import selfIncomeSvg from '../assets/ui/InvestorReport/selfIncome.svg';
import debtSvg from '../assets/ui/InvestorReport/debt.svg';
import commonIncomeSvg from '../assets/ui/InvestorReport/commonIncome.svg';
import shareSvg from '../assets/ui/InvestorReport/share.svg';
import balanceSvg from '../assets/ui/InvestorReport/balance.svg';
import allSelfIncomeSvg from '../assets/ui/InvestorReport/AllSelfIncome.svg';
import CustomTable, { type RowStyle } from '../components/ui/tables/CustomTable';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import { useInvestorPayout } from '../api/hooks/useInvestorPayout';
import type { InvestorPayout, PayoutSource } from '../api/types/investorPayout';
import PayoutModal from '../components/modal/PayoutModal';
import ViewButton from '../components/ui/Buttons/ViewButton';
import InvestorModal from '../components/modal/CrudInherited/InvestorModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useCredit from '../api/hooks/useCredit';
import type { Credit } from '../api/types/credit';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import Pagination from '../components/ui/fields/CustomPagination';
import Tabs from '../components/ui/fields/Tabs';
import { useAuth } from '../сontext/AuthContext';
import useInvestorContribution from '../api/hooks/useInvestorContribution';
import type { InvestorContribution } from '../api/types/investorContribution';
import GrayButton from '../components/ui/Buttons/GrayButton';
import { getInvestorPayouts } from '../api/services/investorPayoutService';
import EditButton from '../components/ui/Buttons/EditButton';
import BaseModal from '../components/modal/BASE/modalCRUBase';
import {
  InputContainer,
  InputLabel,
  InputRow,
} from "../components/Containers/InputComponents";
import CustomInput from "../components/ui/fields/CustomInput";
import CustomCalendar from "../components/ui/fields/CustomCalendar";

const InvestorReportPage = () => {
    const { getInvestors, currentInvestor, getInvestorById, getInvestorReport, updateInvestment } = useInvestor();
    const { 
        payouts, 
        isLoading: isPayoutsLoading, 
        fetchPayouts, 
        addPayout, 
        removePayout,
        makePayoutAction
    } = useInvestorPayout();
    const { 
        investorCredits, 
        getCreditsByInvestorId, 
        isLoading: isCreditsLoading 
    } = useCredit();
    const { hasRole } = useAuth();
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
    const [report, setReport] = useState<InvestorReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState<string>('');
    const [payoutSource, setPayoutSource] = useState<PayoutSource>('income');
    const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
    
    const [dataTab, setDataTab] = useState<'general' | 'expected' | 'current'>('general');
    const [operationsTab, setOperationsTab] = useState<'payouts' | 'credits' | 'contributions'>('payouts');
    
    const { 
        data: contributionsData, 
        isLoading: isContributionsLoading, 
        getProducts: getContributions,
        makeAction: makeContributionAction
    } = useInvestorContribution();

    // Состояния для редактирования инвестиции
    const [isEditInvestmentModalOpen, setIsEditInvestmentModalOpen] = useState(false);
    const [selectedInvestmentForEdit, setSelectedInvestmentForEdit] = useState<{
        id: number;
        amount: number;
        date: string;
    } | null>(null);
    const [editInvestmentAmount, setEditInvestmentAmount] = useState("");
    const [editInvestmentDate, setEditInvestmentDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const [contributionsPage, setContributionsPage] = useState(1);
    const [creditsPage, setCreditsPage] = useState(1);
    const [payoutsPage, setPayoutsPage] = useState(1);
    const pageSize = 5;

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

    const isSuperUser = hasRole('директор') || hasRole('суперадмин');
    
    useEffect(() => {
        if (selectedInvestorId) {
            const fetchReportData = async () => {
                setIsLoading(true);
                try {
                    await getInvestorById(Number(selectedInvestorId));
                    const reportData = await getInvestorReport(Number(selectedInvestorId));
                    setReport(reportData);
                    fetchPayouts(Number(selectedInvestorId));
                    getCreditsByInvestorId(Number(selectedInvestorId), creditsPage, pageSize);
                    
                    getContributions(Number(selectedInvestorId), { 
                        page: contributionsPage, 
                        pageSize: pageSize 
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReportData();
        }
    }, [selectedInvestorId, creditsPage, payoutsPage, contributionsPage, getContributions]);

    // Обработчик редактирования инвестиции
    const handleEditInvestment = (contribution: InvestorContribution) => {
        let dateStr: string;
        if (contribution.date instanceof Date) {
            dateStr = contribution.date.toISOString().split('T')[0];
        } else {
            dateStr = new Date(contribution.date).toISOString().split('T')[0];
        }
        
        setSelectedInvestmentForEdit({
            id: contribution.id,
            amount: contribution.amount,
            date: dateStr,
        });
        setEditInvestmentAmount(contribution.amount.toString());
        setEditInvestmentDate(dateStr);
        setIsEditInvestmentModalOpen(true);
    };

    // Обработчик обновления инвестиции
    const handleUpdateInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvestmentForEdit) return;

        try {
            const amount = parseMoney(editInvestmentAmount);
            if (isNaN(amount) || amount <= 0) {
                alert("Пожалуйста, введите корректную сумму инвестиции");
                return;
            }

            const dateObj = new Date(editInvestmentDate);
            const today = new Date();
            
            const isToday = dateObj.toDateString() === today.toDateString();
            
            if (isToday) {
                dateObj.setHours(
                    today.getHours(),
                    today.getMinutes(),
                    today.getSeconds(),
                    today.getMilliseconds()
                );
            } else {
                dateObj.setHours(12, 0, 0, 0);
            }

            await updateInvestment(selectedInvestmentForEdit.id, amount, dateObj);
            
            setIsEditInvestmentModalOpen(false);
            setEditInvestmentAmount("");
            setEditInvestmentDate(today.toISOString().split('T')[0]);
            setSelectedInvestmentForEdit(null);

            // Перезагружаем данные
            if (selectedInvestorId) {
                getContributions(Number(selectedInvestorId), {
                    page: contributionsPage,
                    pageSize: pageSize
                });
                const updatedReport = await getInvestorReport(Number(selectedInvestorId));
                setReport(updatedReport);
            }
        } catch (err) {
            console.error("Ошибка при обновлении инвестиции:", err);
            alert("Произошла ошибка при обновлении инвестиции");
        }
    };

    const handleInvestorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedInvestorId(e.target.value);
        setCreditsPage(1);
        setPayoutsPage(1);
        setContributionsPage(1);
    };

    const handleContributionAction = async (id: number, action: 'confirm' | 'reject') => {
        try {
            await makeContributionAction(id, action);
            if (selectedInvestorId) {
                getContributions(Number(selectedInvestorId), {
                    page: contributionsPage,
                    pageSize: pageSize
                });
            }
        } catch (error) {
            console.error('Contribution action error:', error);
        }
    };

    const handlePayoutAction = async (id: number, action: 'confirm' | 'reject') => {
        try {
            await makePayoutAction(id, action);
            if (selectedInvestorId) {
                getInvestorPayouts(Number(selectedInvestorId));
            }
        } catch (error) {
            console.error('Contribution action error:', error);
        }
    };

    const contributionsTableData = contributionsData?.items.map((contribution: InvestorContribution) => [
        formatDate(contribution.date.toString()),
        formatMoney(contribution.amount.toString()),
        contribution.confirmed ? (
            <ConfirmedBadge></ConfirmedBadge>
        ) : (
            <ActionButtons>
                <DarkCyanButton style={{margin: "0 auto"}}
                    onClick={() => handleContributionAction(contribution.id, 'confirm')}
                    disabled={isContributionsLoading}
                >
                    Подтвердить
                </DarkCyanButton>
                <GrayButton 
                    onClick={() => handleContributionAction(contribution.id, 'reject')}
                    disabled={isContributionsLoading}
                >
                    Удалить
                </GrayButton>
                <EditButton onClick={() => handleEditInvestment(contribution)} />
            </ActionButtons>
        )
    ]) || [];

    const generatePdf = async (report: InvestorReport, currentInvestor: Investor | null, payouts: InvestorPayout[]) => {
        return new Promise<Blob>(async (resolve, reject) => {
            const pdfContainer = document.createElement('div');
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-9999px';
            pdfContainer.style.width = '800px';
            pdfContainer.style.padding = '20px';
            pdfContainer.style.fontFamily = 'Arial, sans-serif';
            pdfContainer.style.backgroundColor = 'rgba(249, 250, 250, 1)';
            document.body.appendChild(pdfContainer);

            const createCard = (icon: string, value: string, label: string) => `
                <div style="
                    background: rgba(255, 255, 255, 1);
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    height: 100%;
                    flex: 1;
                    min-width: 200px;
                    margin-bottom: 16px;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: rgba(37, 203, 161, 0.1);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    ">
                        <img src="${icon}" width="30" height="30" />
                    </div>
                    <div style="
                        font-size: 20px;
                        font-weight: 600;
                        color: #111827;
                        margin-bottom: 5px;
                    ">${value}</div>
                    <div style="
                        font-size: 14px;
                        color: #6B7280;
                    ">${label}</div>
                </div>
            `;

            pdfContainer.innerHTML = `
                <div style="
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <h1 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 24px;
                        margin-bottom: 5px;
                        border-bottom: 2px solid rgba(37, 203, 161, 1);
                        padding-bottom: 10px;
                    ">
                        Отчёт для инвестора
                    </h1>
                    <p style="
                        color: #6B7280;
                        font-size: 14px;
                        margin: 0;
                    ">
                        Дата формирования: ${formatDate(new Date().toISOString())}
                    </p>
                </div>

                <div style="
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <h2 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="
                            display: inline-block;
                            width: 4px;
                            height: 20px;
                            background: rgba(37, 203, 161, 1);
                            margin-right: 10px;
                            border-radius: 2px;
                        "></span>
                        Информация об инвесторе
                    </h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="margin: 5px 0; color: #374151;"><strong>Псевдоним:</strong> ${currentInvestor?.nickname || 'Не указан'}</p>
                            <p style="margin: 5px 0; color: #374151;"><strong>Телефон:</strong> ${currentInvestor?.phoneNumber ? `<a href="${formatPhoneHref(currentInvestor.phoneNumber)}" style="color:${PHONE_LINK_COLOR};text-decoration:none;">${currentInvestor.phoneNumber}</a>` : 'Не указан'}</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0; color: #374151;"><strong>Статус:</strong> 
                                <span style="color: ${currentInvestor?.isBlocked ? '#EF4444' : 'rgba(37, 203, 161, 1)'}">
                                    ${currentInvestor?.isBlocked ? 'Заблокирован' : 'Активен'}
                                </span>
                            </p>
                            <p style="margin: 5px 0; color: #374151;"><strong>Дата регистрации инвестора:</strong> ${formatDate(report.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div style="
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <h2 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="
                            display: inline-block;
                            width: 4px;
                            height: 20px;
                            background: rgba(37, 203, 161, 1);
                            margin-right: 10px;
                            border-radius: 2px;
                        "></span>
                        Финансовая информация
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        ${createCard(
                            investmentSvg,
                            formatMoney(report.investment.toString()),
                            'Инвестиция'
                        )}
                        
                        ${createCard(
                            activeCreditsSvg,
                            report.activeCreditsAmount.toString(),
                            'Незакрытые договоры'
                        )}
                        
                        ${report.isCompany ? 
                            createCard(
                                commonIncomeSvg,
                                formatMoney((report.investorIncome + report.selfIncome).toString()),
                                'Доход компании'
                            ) : 
                            createCard(
                                shareSvg,
                                currentInvestor?.investorPie.toString() + "%",
                                'Доля инвестора'
                            )
                        }
                        
                        ${!report.isCompany ? createCard(
                            investorIncomeScg,
                            formatMoney(report.investorIncome.toString()),
                            'Доход инвестора'
                        ) : ''}
                        
                        ${createCard(
                            balanceSvg,
                            formatMoney(report.balance.toString()),
                            'Касса'
                        )}

                        ${createCard(
                            debtSvg,
                            formatMoney(report.delinquencyAmount.toString()),
                            'Просрочки руб.'
                        )}
                        ${createCard(
                            allSelfIncomeSvg,
                            formatMoney(report.allSelfIncome.toString()),
                            'Доход от инвесторов.'
                        )}
                        ${createCard(
                            paymentIncomeSvg,
                            formatMoney(report.paymentIncome.toString()),
                            'Доходы по платежам в текущем месяце'
                        )}
                    </div>
                </div>

                <div style="
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    margin-bottom: 30px;
                ">
                    <h2 style="
                        color: rgba(0, 125, 136, 1);
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                    ">
                        <span style="
                            display: inline-block;
                            width: 4px;
                            height: 20px;
                            background: rgba(37, 203, 161, 1);
                            margin-right: 10px;
                            border-radius: 2px;
                        "></span>
                        История выплат
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: rgba(0, 125, 136, 1); color: white;">
                                <th style="padding: 12px; text-align: left; border-radius: 6px 0 0 0;">Дата выплаты</th>
                                <th style="padding: 12px; text-align: left;">Выплатил</th>
                                <th style="padding: 12px; text-align: right; border-radius: 0 6px 0 0;">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payouts.map((payout, index) => `
                                <tr style="border-bottom: 1px solid #E5E7EB; background: ${index % 2 === 0 ? 'rgba(255, 255, 255, 1)' : 'rgba(249, 250, 250, 1)'}">
                                    <td style="padding: 12px; color: #374151;">${formatDate(payout.payoutDate)}</td>
                                    <td style="padding: 12px; color: #374151;">${payout.employeeFullName}</td>
                                    <td style="padding: 12px; text-align: right; color: #374151; font-weight: 500;">${formatMoney(payout.amount.toString())}</td>
                                </tr>
                            `).join('')}
                            ${payouts.length === 0 ? `
                                <tr>
                                    <td colspan="3" style="padding: 15px; text-align: center; color: #9CA3AF; background: rgba(255, 255, 255, 1);">
                                        Не было выплат
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>

                <div style="
                    padding: 15px;
                    text-align: center;
                    color: #6B7280;
                    font-size: 12px;
                    background: rgba(255, 255, 255, 1);
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                ">
                    <p>© ${new Date().getFullYear()} WayPay. Все права защищены.</p>
                </div>
            `;

                try {
                    const canvas = await html2canvas(pdfContainer, {
                        scale: 4,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        width: pdfContainer.offsetWidth,
                        height: pdfContainer.scrollHeight,
                        windowWidth: pdfContainer.scrollWidth,
                        windowHeight: pdfContainer.scrollHeight
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgWidth = 210;
                    const pageHeight = 295;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    document.body.removeChild(pdfContainer);

                    const pdfBlob = pdf.output('blob');
                    resolve(pdfBlob);
                } catch (error) {
                    document.body.removeChild(pdfContainer);
                    reject(error);
                }
            });
    };

    const exportToPdf = async (report: InvestorReport, currentInvestor: Investor | null, payouts: InvestorPayout[]) => {
        try {
            const pdfBlob = await generatePdf(report, currentInvestor, payouts);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfUrl;
            downloadLink.download = `Отчет_инвестора_${currentInvestor?.nickname || currentInvestor?.fullName || 'Без_названия'}_${formatDate(new Date().toISOString())}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        } catch (error) {
            console.error('Ошибка при генерации PDF:', error);
            alert('Произошла ошибка при генерации PDF');
        }
    };

    const handleShareClick = async () => {
        if (!report || !currentInvestor) return;
        
        try {
            const pdfBlob = await generatePdf(report, currentInvestor, payouts);
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], `Отчет_инвестора_${currentInvestor.nickname || currentInvestor.fullName}.pdf`, { type: 'application/pdf' })] })) {
                await navigator.share({
                    title: `Отчёт инвестора ${currentInvestor.nickname || currentInvestor.fullName}`,
                    text: `Финансовый отчет по инвестору ${currentInvestor.nickname || currentInvestor.fullName}`,
                    files: [new File([pdfBlob], `Отчет_инвестора_${currentInvestor.nickname || currentInvestor.fullName}.pdf`, { type: 'application/pdf' })]
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: `Отчёт инвестора ${currentInvestor.nickname || currentInvestor.fullName}`,
                    text: `Финансовый отчет по инвестору ${currentInvestor.nickname || currentInvestor.fullName}. Инвестиция: ${formatMoney(report.investment.toString())}, Доход: ${formatMoney(report.investorIncome.toString())}`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Ссылка скопирована в буфер обмена');
            }
        } catch (error) {
            console.error('Ошибка при попытке поделиться:', error);
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Ссылка скопирована в буфер обмена');
            } catch (err) {
                console.error('Не удалось скопировать ссылку:', err);
                prompt('Скопируйте эту ссылку для общего доступа:', window.location.href);
            }
        }
    };

    const handlePayoutSubmit = async () => {
        if (!selectedInvestorId || !payoutAmount || !currentInvestor || !report) return;
        
        const numericAmount = Number(payoutAmount.replace(/\D/g, ''));
        let maxAllowedAmount = 0;

        maxAllowedAmount = report.balance;

        if (numericAmount > maxAllowedAmount) {
            alert(`Нельзя выплатить больше чем ${formatMoney(maxAllowedAmount.toString())}`);
            return;
        }

        try {
            await addPayout({
                investorId: Number(selectedInvestorId),
                amount: numericAmount,
                payoutSource: payoutSource
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
        payout.confirmed ? (
            <ConfirmedBadge></ConfirmedBadge>
        ) : (
            <ActionButtons>
                <DarkCyanButton style={{margin: "0 auto"}}
                    onClick={() => handlePayoutAction(payout.id, 'confirm')}
                    disabled={isContributionsLoading}
                >
                    Подтвердить
                </DarkCyanButton>
                <GrayButton 
                    onClick={() => handlePayoutAction(payout.id, 'reject')}
                    disabled={isContributionsLoading}
                >
                    Удалить
                </GrayButton>
            </ActionButtons>
        )
    ]);

    const creditsTableData = investorCredits?.items.map((credit: Credit) => {
        const hasDebt = credit.debt > 0;
        const isActive = credit.isActive;
        
        return [
            formatDate(credit.creditDate.toString()),
            credit.clientFullName,
            credit.clientPhone,
            formatMoney(credit.accured.toString()),
            formatMoney(credit.payed.toString()),
            formatMoney(credit.rest.toString()),
            formatMoney(credit.debt.toString()),
            hasDebt, 
            isActive
        ];
    }) || [];

    const rowStyles = investorCredits?.items.reduce((styles, credit, index) => {
        const style: RowStyle = {};
        
        if (credit.debt > 0) {
            style.backgroundColor = 'rgba(232, 216, 216, 1)';
        }
        
        if (!credit.isActive) {
            style.backgroundColor = 'rgba(81, 213, 180, 1)';
            style.color = 'black';
        }
        
        if (Object.keys(style).length > 0) {
            styles[index] = style;
        }
        
        return styles;
    }, {} as { [key: number]: RowStyle });

    const renderGeneralCards = () => (
        <>
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
                <>
                </>    
            ) : (
                <>
                    <ReportCard>
                        <IconContainer>
                            <Icon src={shareSvg} alt="Total income" />
                        </IconContainer>
                        <ReportValue>{currentInvestor?.investorPie.toString() + "%"}</ReportValue>
                        <ReportLabel>Доля инвестора</ReportLabel>
                    </ReportCard>                         
                </>
            )}

            <ReportCard>
                <IconContainer>
                    <Icon src={balanceSvg} alt="Balance" />
                </IconContainer>
                <ReportValue>{formatMoney(report.balance.toString())}</ReportValue>
                <ReportLabel>Касса</ReportLabel>
            </ReportCard>
            
            <ReportCard>
                <IconContainer>
                    <Icon src={debtSvg} alt="Debt" />
                </IconContainer>
                <ReportValue>{formatMoney(report.delinquencyAmount.toString())}</ReportValue>
                <ReportLabel>Просрочки руб.</ReportLabel>
            </ReportCard>
        </>
    );

    const renderExpectedIncomeCards = () => (
        <>
            {report.isCompany ? (
                <>
                    <ReportCard>
                        <IconContainer>
                            <Icon src={commonIncomeSvg} alt="Company income" />
                        </IconContainer>
                        <ReportValue>{formatMoney((report.allSelfIncome).toString())}</ReportValue>
                        <ReportLabel>Доход компании</ReportLabel>
                    </ReportCard>

                    <ReportCard>
                        <IconContainer>
                            <Icon src={allSelfIncomeSvg} alt="allSelfIncome" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.investorIncome.toString())}</ReportValue>
                        <ReportLabel>Доход от инвесторов</ReportLabel>
                    </ReportCard>
                </>    
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
        </>
    );

    const renderCurrentIncomeCards = () => (
        <>
            {report.isCompany ? (
                <>
                    <ReportCard>
                        <IconContainer>
                            <Icon src={paymentIncomeSvg} alt="paymentIncome" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.paymentIncome.toString())}</ReportValue>
                        <ReportLabel>Текущий доход </ReportLabel>
                    </ReportCard>

                    <ReportCard>
                        <IconContainer>
                            <Icon src={allSelfIncomeSvg} alt="allSelfIncome" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.investorPaymentIncome.toString())}</ReportValue>
                        <ReportLabel>Доход от инвесторов</ReportLabel>
                    </ReportCard>
                </>    
            ) : (
                <>
                    <ReportCard>
                        <IconContainer>
                            <Icon src={investorIncomeScg} alt="Investor income" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.investorPaymentIncome.toString())}</ReportValue>
                        <ReportLabel>Текущий доход инвестора</ReportLabel>
                    </ReportCard>

                    <ReportCard>
                        <IconContainer>
                            <Icon src={commonIncomeSvg} alt="Company income" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.selfPaymentIncome.toString())}</ReportValue>
                        <ReportLabel>Текущий собственный доход </ReportLabel>
                    </ReportCard>

                    <ReportCard>
                        <IconContainer>
                            <Icon src={selfIncomeSvg} alt="Self income" />
                        </IconContainer>
                        <ReportValue>{formatMoney(report.paymentIncome.toString())}</ReportValue>
                        <ReportLabel>Текущий общий доход </ReportLabel>
                    </ReportCard>

                </>
            )}
        </>
    );

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Отчёт для инвесторов</CustomTitle>
                {isSuperUser && (
                    <>
                        <ExportButton 
                            onClick={() => report && currentInvestor && exportToPdf(report, currentInvestor, payouts)} 
                            disabled={!report}
                        />
                        <ExportButton
                            children={"Поделиться"}
                            icon={<ShareIcon />}
                            onClick={handleShareClick} 
                            disabled={!report}
                        />
                    </>
                )}
            </TitleField>

            <ContentContainer>
                {report && (
                    <CreationDate>
                        Инвестор создан {formatDate(report.createdAt)}
                    </CreationDate>
                )}

                <InvestorInfoContainer>
                    <SelectWithViewWrapper>
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
                        {isSuperUser && (
                            <ViewButton 
                                onClick={() => setIsViewInvestorModalOpen(true)} 
                                disabled={!selectedInvestorId}
                            />
                        )}
                    </SelectWithViewWrapper>
                    <DarkCyanButton 
                        onClick={() => setIsPayoutModalOpen(true)}
                        style={{marginLeft: "auto"}}
                    >
                        Выплатить инвестору
                    </DarkCyanButton>
                </InvestorInfoContainer>

                <TabsContainer>
                    <Tabs<'general' | 'expected' | 'current'>
                        tabs={[
                            { id: 'general', label: 'Общие данные' },
                            { id: 'expected', label: 'Ожидаемый доход' },
                            { id: 'current', label: 'Текущий доход' }
                        ]}
                        activeTab={dataTab}
                        onChange={(tabId) => setDataTab(tabId)}
                    />
                </TabsContainer>

                {report && (
                    <ReportDataContainer>
                        {dataTab === 'general' && renderGeneralCards()}
                        {dataTab === 'expected' && renderExpectedIncomeCards()}
                        {dataTab === 'current' && renderCurrentIncomeCards()}
                    </ReportDataContainer>
                )}

                <ModalInfoTitle>История операций</ModalInfoTitle>

                <TabsContainer>
                    <Tabs<'payouts' | 'credits' | 'contributions'>
                        tabs={[
                            { id: 'payouts', label: 'История выплат' },
                            { id: 'credits', label: 'Договоры' },
                            { id: 'contributions', label: 'История инвестиций' }
                        ]}
                        activeTab={operationsTab}
                        onChange={(tabId) => setOperationsTab(tabId)}
                    />
                </TabsContainer>

                {operationsTab === 'payouts' ? (
                    <>
                        <CustomTable 
                            columns={[
                                { name: "Дата выплаты", isSortable: true },
                                { name: "Выплатил", align: "left" },
                                { name: "Выплата, руб", isSortable: true, align: "left" },
                                { name: "Действия", align: "center" }
                            ]} 
                            data={payoutTableData}
                            isLoading={isPayoutsLoading}
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={payouts?.length || 0} 
                            />
                            <Pagination
                                total={payouts?.length || 0}
                                current={payoutsPage}
                                onChange={(page) => setPayoutsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                ) : operationsTab === 'credits' ? (
                    <>
                        <CustomTable 
                            columns={[
                                { name: "Дата договора", isSortable: true },
                                { name: "Клиент", align: "left" },
                                { name: "Телефон", align: "left" },
                                { name: "Начислено", isSortable: true, align: "left" },
                                { name: "Уплачено", align: "left" },
                                { name: "Остаток", align: "left" },
                                { name: "Долг", align: "left" },
                                { name: "Долг", align: "left", isHidden: true },
                                { name: "Долг", align: "left", isHidden: true },
                            ]} 
                            data={creditsTableData}
                            isLoading={isCreditsLoading}
                            rowStyles={rowStyles}
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={investorCredits?.totalCount || 0} 
                            />
                            <Pagination
                                total={investorCredits?.totalCount || 0}
                                current={creditsPage}
                                onChange={(page) => setCreditsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                ) : (
                    <>
                        <CustomTable 
                            columns={[
                                { name: "Дата", isSortable: true },
                                { name: "Сумма инвестиции, руб", isSortable: true, align: "left" },
                                { name: "Действия", align: "center" }
                            ]} 
                            data={contributionsTableData}
                            isLoading={isContributionsLoading}  
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={contributionsData?.totalCount || 0} 
                            />
                            <Pagination
                                total={contributionsData?.totalCount || 0}
                                current={contributionsPage}
                                onChange={(page) => setContributionsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                )}

                {/* Модальное окно редактирования инвестиции */}
                {isEditInvestmentModalOpen && selectedInvestmentForEdit && (
                    <BaseModal
                        title={`Редактирование инвестиции`}
                        onClose={() => setIsEditInvestmentModalOpen(false)}
                        onCancel={() => setIsEditInvestmentModalOpen(false)}
                        onSave={handleUpdateInvestment}
                        isSaveDisabled={
                            !editInvestmentAmount ||
                            isNaN(parseFloat(editInvestmentAmount)) ||
                            parseFloat(editInvestmentAmount) <= 0
                        }
                        mode="edit"
                    >
                        <form onSubmit={handleUpdateInvestment} style={{ padding: "20px" }}>
                            <InputRow>
                                <InputLabel>Сумма инвестиции:</InputLabel>
                                <InputContainer>
                                    <CustomInput
                                        name="investmentAmount"
                                        inputType="rubles"
                                        placeholder="Сумма"
                                        value={editInvestmentAmount}
                                        onChange={(e) => setEditInvestmentAmount(e.target.value)}
                                    />
                                </InputContainer>
                            </InputRow>
                            <InputRow>
                                <InputLabel>Дата инвестиции</InputLabel>
                                <InputContainer>
                                    <CustomCalendar
                                        placeholder="Дата инвестиции"
                                        value={editInvestmentDate}
                                        onChange={(dateString) => setEditInvestmentDate(dateString)}
                                    />
                                </InputContainer>
                            </InputRow>
                        </form>
                    </BaseModal>
                )}

                <PayoutModal
                    isOpen={isPayoutModalOpen}
                    onClose={() => setIsPayoutModalOpen(false)}
                    amount={payoutAmount}
                    onAmountChange={setPayoutAmount}
                    onSubmit={handlePayoutSubmit}
                    investment={report?.investment || 0}
                    payoutSource={payoutSource}
                    onPayoutSourceChange={setPayoutSource}
                    firstContribution={currentInvestor?.firstContribution || null}
                    maxAmount={
                        currentInvestor?.isBlocked 
                        ? report?.balance || 0 
                        : report?.isCompany 
                        ? (report?.investorIncome || 0) + (report?.selfIncome || 0)
                        : report?.investorIncome || 0
                    }
                    balance={report?.balance || 0}
                    isLoading={isPayoutsLoading}
                    currentIncome={
                        report?.isCompany 
                        ? report?.paymentIncome || 0
                        : report?.investorPaymentIncome || 0
                    }
                    expectedIncome={
                        report?.isCompany 
                        ? (report?.allSelfIncome || 0)
                        : report?.investorIncome || 0
                    }
                    isCompany={report?.isCompany || false}
                />

                <InvestorModal
                    mode="view"
                    isOpen={isViewInvestorModalOpen}
                    onClose={() => setIsViewInvestorModalOpen(false)}
                    onSubmit={async () => false}
                    initialData={currentInvestor ? {
                        id: currentInvestor.id,
                        nickname: currentInvestor.nickname,
                        fullName: currentInvestor.fullName,
                        phoneNumber: currentInvestor.phoneNumber,
                        investorPie: currentInvestor.investorPie,
                        investmentAmount: currentInvestor.investmentAmount ?? 0,
                        balance: currentInvestor.balance,
                        isCompany: currentInvestor.isCompany,
                        isBlocked: currentInvestor.isBlocked
                    } : undefined}
                />
            </ContentContainer>
        </PageLayout>
    );
};


const TabsContainer = styled.div`
    margin: 30px 0 20px;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
`;

const ConfirmButton = styled.button`
    background: rgba(37, 203, 161, 1);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: rgba(29, 163, 129, 1);
    }

    &:disabled {
        background: rgba(37, 203, 161, 0.5);
        cursor: not-allowed;
    }
`;

const RejectButton = styled.button`
    background: rgba(239, 68, 68, 1);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: rgba(220, 38, 38, 1);
    }

    &:disabled {
        background: rgba(239, 68, 68, 0.5);
        cursor: not-allowed;
    }
`;

const ConfirmedBadge = styled.span`
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
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

const SelectWithViewWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-grow: 1;
    max-width: 400px;
`;

const SelectWrapper = styled.div`
    flex-grow: 1;
`;

const ReportDataContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    width: 100%;
    margin-bottom: 32px;
`;

const ReportCard = styled.div`
    background-color: white;
    border: 1px solid rgba(209, 213, 219, 1);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: left;
    position: relative;
    padding-bottom: 20px;
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
    font-size: 15px;
    color: black;
    margin: 7px 0px 0px;
    text-align: left;
    width: 100%;
    padding-left: 25px;
`;

const ReportValue = styled.span`
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    text-align: left;
    margin: 90px 0 0;
    width: 100%;
    padding-left: 25px;
`;

const ShareIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9L1.5 6L14.5 1.5Z"
            stroke="black"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
        />
    </svg>
);

export default InvestorReportPage;
