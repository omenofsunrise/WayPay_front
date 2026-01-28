import { useState, useEffect } from 'react';
import styled from 'styled-components';
import ExportButton from "../components/ui/Buttons/ExportButton";
import PageLayout from "../components/ui/Layouts/PageLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CustomTitle from "../components/ui/Text/CustomTitle";
import type { Investor, InvestorReport } from '../api/types/investor';
import useInvestor from '../api/hooks/useInvestor';
import { formatDate } from '../utils/dateFormatter';
import { formatPhoneHref } from '../utils/phoneUtils';
import { formatMoney, parseMoney } from '../utils/formatPrice';
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
import { useInvestorPayout } from '../api/hooks/useInvestorPayout';
import type { InvestorPayout, PayoutSource } from '../api/types/investorPayout';
import PayoutModal from '../components/modal/PayoutModal';
import InvestorModal from '../components/modal/CrudInherited/InvestorModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useCredit from '../api/hooks/useCredit';
import type { Credit } from '../api/types/credit';
import PaginationLayout from '../components/ui/Layouts/PaginationLayout';
import CountInfoTitle from '../components/ui/Text/CountInfoTitle';
import Pagination from '../components/ui/fields/CustomPagination';
import Tabs from '../components/ui/fields/Tabs';
import useInvestorPool from '../api/hooks/useInvestorPool';
import EditButton from '../components/ui/Buttons/EditButton';
import AddButton from '../components/ui/Buttons/AddButton';
import DeleteButton from '../components/ui/Buttons/DeleteButton';
import type { InvestorPool } from '../api/types/investorPool';
import DarkCyanButton from '../components/ui/Buttons/DarkCyanButton';
import BaseModal from '../components/modal/BASE/modalCRUBase';
import { InputContainer, InputLabel, InputRow } from '../components/Containers/InputComponents';
import CustomInput from '../components/ui/fields/CustomInput';
import CreatePoolModal from '../components/modal/CreatePoolModal';
import useInvestorContribution from '../api/hooks/useInvestorContribution';
import type { InvestorContribution } from '../api/types/investorContribution';
import InvestorSelect from '../components/ui/fields/InvestorSelect';

const InvestorsPoolPage = () => {
const { 
        getInvestors, 
        getInvestorById, 
        deleteInvestor,
        createInvestor,
        updateInvestor,
        addInvestment
    } = useInvestor();
    
    const { 
        payouts, 
        isLoading: isPayoutsLoading, 
        fetchPoolPayouts, 
        addPayout, 
        removePayout 
    } = useInvestorPayout();
    
    const { 
        data, 
        getCredits,
        getCreditsByInvestorId,
        isLoading: isCreditsLoading 
    } = useCredit();
    
    const {
        getInvestorPools,
        createInvestorPool,
        updateInvestorPoolName,
        updateInvestorPoolPie,
        deleteInvestorPool,
        getInvestorPoolReport,
        reinvestInvestorPool,
        reportData,
        data: poolsData
    } = useInvestorPool();

    const {
        data: contributionsData,
        getProducts: getContributions,
        isLoading: isContributionsLoading,
        makeAction: makeContributionAction
    } = useInvestorContribution();

    const [filteredCredits, setFilteredCredits] = useState<{
        items: Credit[];
        totalCount: number;
    } | null>(null)

    const [selectedInvestorForFilter, setSelectedInvestorForFilter] = useState<{
        id: number;
        name: string;
        type?: 'investor' | 'pool';
    } | null>(null);
    const [filteredContributions, setFilteredContributions] = useState<{
        items: InvestorContribution[];
        totalCount: number;
    } | null>(null);

    const [filteredPayouts, setFilteredPayouts] = useState<InvestorPayout[]>([]);
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [investorsData, setInvestorsData] = useState<any>(null);
    const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
    const [currentInvestor, setCurrentInvestor] = useState<Investor | null>(null);
    const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
    const [selectedPoolId, setSelectedPoolId] = useState<string>('');
    const [report, setReport] = useState<InvestorReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isViewInvestorModalOpen, setIsViewInvestorModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'payouts' | 'credits' | 'investors' | 'contributions'>('investors');
    const [dataTab, setDataTab] = useState<'general' | 'expected' | 'current'>('general');
    const [creditsPage, setCreditsPage] = useState(1);
    const [payoutsPage, setPayoutsPage] = useState(1);
    const [contributionsPage, setContributionsPage] = useState(1);
    const [investorsPage, setInvestorsPage] = useState(1);
    const [investorsCreditsPage, setInvestorsCreditsPage] = useState(1);
    const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);
    const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
    const [newPoolName, setNewPoolName] = useState('');
    const pageSize = 10;
    const [pools, setPools] = useState<InvestorPool[]>([]);
    const [newPoolPie, setNewPoolPie] = useState<number>(0);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState<string>('');
    const [selectedInvestorForPayout, setSelectedInvestorForPayout] = useState<Investor | null>(null);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState('');
    const [selectedInvestorForInvestment, setSelectedInvestorForInvestment] = useState<Investor | null>(null);
    const [payoutSource, setPayoutSource] = useState<PayoutSource>('income');
    // Новые состояния для модального окна кредитов инвестора
    const [isInvestorCreditsModalOpen, setIsInvestorCreditsModalOpen] = useState(false);
    const [selectedInvestorForCredits, setSelectedInvestorForCredits] = useState<Investor | null>(null);
    const [investorCreditsData, setInvestorCreditsData] = useState<{
        items: Credit[];
        totalCount: number;
    } | null>(null);
    const [isInvestorCreditsLoading, setIsInvestorCreditsLoading] = useState(false);
    // Состояние для поиска
    const [searchValue, setSearchValue] = useState<string>('');

    useEffect(() => {
        if (selectedPoolId && activeTab === 'credits') {
            setIsLoading(true);
            
            const fetchCredits = async () => {
                try {
                    let creditsData;
                    
                    // Если выбран инвестор для фильтрации
                    if (selectedInvestorForFilter?.id) {
                        // Используем ID инвестора для фильтрации
                        creditsData = await getCreditsByInvestorId(
                            Number(selectedInvestorForFilter.id),
                            creditsPage,
                            pageSize
                        );
                        // Устанавливаем отфильтрованные данные
                        setFilteredCredits(creditsData);
                    } else {
                        // Иначе загружаем все договоры пула
                        creditsData = await getCredits({
                            investorPoolId: Number(selectedPoolId),
                            page: creditsPage,
                            pageSize: pageSize
                        });
                        // Очищаем отфильтрованные данные
                        setFilteredCredits(null);
                    }
                } catch (error) {
                    console.error('Error fetching credits:', error);
                    setFilteredCredits(null);
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchCredits();
        }
    }, [selectedPoolId, creditsPage, activeTab, selectedInvestorForFilter, getCredits, getCreditsByInvestorId]);

    useEffect(() => {
        if (selectedPoolId && activeTab === 'contributions' && selectedInvestorForFilter?.id) {
            const fetchContributionsByInvestor = async () => {
                setIsLoading(true);
                try {
                    const contributions = await getContributions(Number(selectedInvestorForFilter.id), Number(selectedPoolId), {
                        page: contributionsPage,
                        pageSize: pageSize
                    });
                    setFilteredContributions(contributions);
                } catch (error) {
                    console.error('Error fetching contributions by investor:', error);
                    setFilteredContributions(null);
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchContributionsByInvestor();
        } else if (selectedPoolId && activeTab === 'contributions') {
            setFilteredContributions(null);
            getContributions(undefined, Number(selectedPoolId), {
                page: contributionsPage,
                pageSize: pageSize
            });
        }
    }, [selectedPoolId, contributionsPage, activeTab, selectedInvestorForFilter, getContributions]);

    useEffect(() => {
        if (selectedInvestorForCredits && isInvestorCreditsModalOpen) {
            const loadCredits = async () => {
                setIsInvestorCreditsLoading(true);
                try {
                    const creditsData = await getCreditsByInvestorId(
                        selectedInvestorForCredits.id, 
                        investorsCreditsPage, 
                        pageSize
                    );
                    setInvestorCreditsData(creditsData);
                } catch (error) {
                    console.error('Error fetching investor credits:', error);
                    setInvestorCreditsData(null);
                } finally {
                    setIsInvestorCreditsLoading(false);
                }
            };
            
            loadCredits();
        }
    }, [investorsCreditsPage, isInvestorCreditsModalOpen]);

    useEffect(() => {
        if (selectedPoolId) {
            const fetchInvestors = async () => {
                try {
                    const result = await getInvestors({ 
                        poolId: Number(selectedPoolId), 
                        page: investorsPage,
                        pageSize: pageSize 
                    });
                    if (result) {
                        setInvestors(result.items);
                        setInvestorsData(result);
                    }
                } catch (error) {
                    console.error('Error fetching investors:', error);
                }
            };
            fetchInvestors();
        }
    }, [selectedPoolId, getInvestors, investorsPage]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const pools = await getInvestorPools();
                if (pools?.items) {
                    setPools(pools.items);
                    if (pools.items.length > 0) {
                        setSelectedPoolId(pools.items[0].id.toString());
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [getInvestorPools]);

    useEffect(() => {
        if (selectedPoolId) {
            const fetchReportData = async () => {
                setIsLoading(true);
                try {
                    const reportData = await getInvestorPoolReport(Number(selectedPoolId));
                    setReport(reportData);
                    fetchPoolPayouts(Number(selectedPoolId));
                    getCredits({
                        investorPoolId: Number(selectedPoolId),
                        page: creditsPage,
                        pageSize: pageSize
                    });
                    getContributions(undefined, Number(selectedPoolId), {
                        page: contributionsPage,
                        pageSize: pageSize
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchReportData();
        }
    }, [selectedPoolId, creditsPage, payoutsPage, contributionsPage]);

    useEffect(() => {
        if (selectedPoolId && activeTab === 'investors') {
            const fetchInvestors = async () => {
                try {
                    const result = await getInvestors({ 
                        poolId: Number(selectedPoolId), 
                        page: investorsPage,
                        pageSize: pageSize 
                    });
                    if (result) {
                        setInvestors(result.items);
                        setInvestorsData(result);
                    }
                } catch (error) {
                    console.error('Error fetching investors:', error);
                }
            };
            fetchInvestors();
        }
    }, [investorsPage, activeTab, selectedPoolId]);

    useEffect(() => {
        if (selectedPoolId && activeTab === 'contributions') {
            getContributions(undefined, Number(selectedPoolId), {
                page: contributionsPage,
                pageSize: pageSize
            });
        }
    }, [contributionsPage, activeTab, selectedPoolId]);

    useEffect(() => {
        if (selectedPoolId && activeTab === 'payouts') {
            if (selectedInvestorForFilter?.id) {
                // Фильтруем выплаты по выбранному инвестору
                const filtered = payouts.filter(payout => 
                    payout.investorId === selectedInvestorForFilter.id
                );
                setFilteredPayouts(filtered);
            } else {
                // Показываем все выплаты пула
                setFilteredPayouts(payouts);
            }
        }
    }, [payouts, selectedInvestorForFilter, selectedPoolId, activeTab]);

    const handleInvestorDoubleClick = async (investor: Investor) => {
        setSelectedInvestorForCredits(investor);
        setIsInvestorCreditsLoading(true);
        setIsInvestorCreditsModalOpen(true);
        
        try {
            const creditsData = await getCreditsByInvestorId(investor.id, investorsCreditsPage, pageSize);
            
            setInvestorCreditsData(creditsData);
        } catch (error) {
            console.error('Error fetching investor credits:', error);
            setInvestorCreditsData(null);
        } finally {
            setIsInvestorCreditsLoading(false);
        }
    };

    const handleInvestorSelect = (investor: { 
        id: number; 
        nickname: string; 
        fullName: string; 
        phoneNumber: string;
        investorPie: number;
        investmentAmount: number;
        balance: number;
        type?: 'investor' | 'pool';
    }) => {
        setSelectedInvestorForFilter({
            id: investor.id,
            name: investor.nickname || investor.fullName,
            type: investor.type || 'investor'
        });
        
        setSearchValue(investor.nickname || investor.fullName || '');
        
        // Сбрасываем пагинацию в зависимости от активной вкладки
        if (activeTab === 'credits') {
            setCreditsPage(1);
        } else if (activeTab === 'contributions') {
            setContributionsPage(1);
        } else if (activeTab === 'payouts') {
            setPayoutsPage(1);
        }
    };

    const handleInvestorSelectChange = (value: string) => {
        if (!value || value === '') {
            setSelectedInvestorForFilter(null);
            setSearchValue('');
            
            // Сбрасываем фильтрацию в зависимости от активной вкладки
            if (activeTab === 'credits') {
                setCreditsPage(1);
                if (selectedPoolId) {
                    getCredits({
                        investorPoolId: Number(selectedPoolId),
                        page: 1,
                        pageSize: pageSize
                    }).then(data => {
                        setFilteredCredits(null);
                    });
                }
            } else if (activeTab === 'payouts') {
                setPayoutsPage(1);
                setFilteredPayouts(payouts);
            } else if (activeTab === 'contributions') {
                setContributionsPage(1);
            }
        } else {
            setSearchValue(value);
        }
    };

    const investorsTableData = investors.map((investor: Investor) => {
        const createDoubleClickCell = (content: React.ReactNode) => (
            <DoubleClickCell onDoubleClick={() => handleInvestorDoubleClick(investor)}>
                {content}
            </DoubleClickCell>
        );

        return [
            investor.id.toString(),
            createDoubleClickCell(investor.fullName ?? '-'),
            createDoubleClickCell(investor.phoneNumber ? <a href={formatPhoneHref(investor.phoneNumber)}>{investor.phoneNumber}</a> : '-'),
            createDoubleClickCell(investor.investmentAmount ? formatMoney(investor.investmentAmount.toString()) : '-'),
            createDoubleClickCell(investor.pieInPool !== null && investor.pieInPool !== undefined ? `${investor.pieInPool}%` : '-'),
            createDoubleClickCell(investor.currentIncome ? formatMoney(investor.currentIncome.toString()) : '-'),
            <EditButton onClick={() => handleEditInvestor(investor)} />,
            <DeleteButton onClick={() => handleDeleteInvestor(investor)} />,
            <DarkCyanButton onClick={() => handleAddInvestment([investor.id.toString()])}>
                Новая инвестиция
            </DarkCyanButton>,
            <DarkCyanButton onClick={() => handlePayoutClick(investor)}>
                Выплатить
            </DarkCyanButton>
        ];
    });

    const handleAddInvestment = (rowData: any[]) => {
        const investorId = Number(rowData[0]);
        const investor = investors.find(i => i.id === investorId);
        
        if (investor) {
            setSelectedInvestorForInvestment(investor);
            setIsInvestmentModalOpen(true);
        }
    };

    const handleSubmitInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvestorForInvestment) return;

        try {
            const amount = parseMoney(investmentAmount);
            if (isNaN(amount) || amount <= 0) {
                alert('Пожалуйста, введите корректную сумму инвестиции');
                return;
            }

            await addInvestment(selectedInvestorForInvestment.id, amount);
            setIsInvestmentModalOpen(false);
            setInvestmentAmount('');
            setSelectedInvestorForInvestment(null);
            
            await reloadData();
        } catch (err) {
            console.error('Ошибка при добавлении инвестиции:', err);
            alert('Произошла ошибка при добавлении инвестиции');
        }
    };

    const handlePayoutClick = (investor: Investor) => {
        setSelectedInvestorForPayout(investor);
        setPayoutAmount('');
        setPayoutSource('income');
        setIsPayoutModalOpen(true);
    };

    const handleAddInvestor = () => {
        setCurrentInvestor(null);
        setIsInvestorModalOpen(true);
    };

    const handleReinvest = () => {
        if (window.confirm('Вы уверены, что хотите реинвестировать доходы ВСЕХ инвесторов?')) {
            reinvestInvestorPool(Number(selectedPoolId));
            reloadData();
        }
    };

    const handleEditInvestor = (investor: Investor) => {
        setCurrentInvestor(investor);
        setIsInvestorModalOpen(true);
    };

    const handleDeleteInvestor = async (investor: Investor) => {
        if (investor.isCompanyPool) {
            window.alert('Нельзя удалить свою компанию как инвестора');
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить этого инвестора?')) {
            try {
                await deleteInvestor(investor.id);
                await reloadData();
            } catch (error) {
                console.error('Error deleting investor:', error);
            }
        }
    };

    const handleInvestorSubmit = async (investorData: Partial<Investor>) => {
        try {
            if (currentInvestor) {
                const updatedInvestor = await updateInvestor(currentInvestor.id, investorData);
                if (updatedInvestor) {
                    setInvestors(investors.map(inv => 
                        inv.id === currentInvestor.id ? updatedInvestor : inv
                    ));
                }
            } else {
                const newInvestor = await createInvestor({
                    ...investorData,
                    poolId: Number(selectedPoolId)
                } as Omit<Investor, 'id'>);
                if (newInvestor) {
                    setInvestors([...investors, newInvestor]);
                }
            }
            setIsInvestorModalOpen(false);
            
            await reloadData();
        } catch (error) {
            console.error('Error saving investor:', error);
        }
    };

    const reloadData = async () => {
        if (selectedPoolId) {
            try {
                const result = await getInvestors({ 
                    poolId: Number(selectedPoolId),
                    page: investorsPage,
                    pageSize: pageSize
                });
                if (result) {
                    setInvestors(result.items);
                    setInvestorsData(result);
                }
                
                const reportData = await getInvestorPoolReport(Number(selectedPoolId));
                setReport(reportData);
                
                await fetchPoolPayouts(Number(selectedPoolId));
                
                if (activeTab === 'contributions') {
                    getContributions(undefined, Number(selectedPoolId), {
                        page: contributionsPage,
                        pageSize: pageSize
                    });
                }
                
            } catch (error) {
                console.error('Error reloading data:', error);
            }
        }
    };

    const handleContributionAction = async (id: number, action: string) => {
        try {
            await makeContributionAction(id, action);
            if (selectedPoolId) {
                getContributions(undefined, Number(selectedPoolId), {
                    page: contributionsPage,
                    pageSize: pageSize
                });
            }
        } catch (error) {
            console.error('Error performing contribution action:', error);
        }
    };

    const contributionsTableData = (filteredContributions?.items || contributionsData?.items || []).map((contribution: InvestorContribution) => [
        formatDate(contribution.date),
        contribution.investorNickname || '-',
        formatMoney(contribution.amount.toString()),
        <div style={{ display: 'flex', gap: '8px' }}>
            {/* Кнопки действий для инвестиций */}
        </div>
    ]) || [];

    const handleCreatePool = async () => {
        if (!newPoolName.trim()) return;
        
        try {
            const newPool = await createInvestorPool({
                name: newPoolName,
                pie: newPoolPie
            }, Number(selectedInvestorId));
            
            if (newPool) {
                setPools(prevPools => [...prevPools, newPool]);
                setSelectedPoolId(newPool.id.toString());
            }
            
            setIsCreatePoolModalOpen(false);
            setNewPoolName('');
            setNewPoolPie(0);
        } catch (error) {
            console.error('Error creating pool:', error);
        }
    };

    const handleUpdatePoolName = async () => {
        if (!newPoolName.trim() || !selectedPoolId) return;
        
        try {
            await updateInvestorPoolName(Number(selectedPoolId), newPoolName);
            await updateInvestorPoolPie((Number(selectedPoolId)), newPoolPie);

            setPools(prevPools => 
                prevPools.map(pool => 
                    pool.id === Number(selectedPoolId) 
                    ? { ...pool, name: newPoolName, pie: newPoolPie }
                    : pool
                )
            );
            
            setIsEditPoolModalOpen(false);
            setNewPoolName('');
            setNewPoolPie(0);
        } catch (error) {
            console.error('Error updating pool:', error);
        }
    };

    const handleDeletePool = async () => {
        if (!selectedPoolId) return;
        
        try {
            await deleteInvestorPool(Number(selectedPoolId));
            
            const updatedPools = pools.filter(pool => pool.id !== Number(selectedPoolId));
            setPools(updatedPools);
            
            if (selectedPoolId === selectedPoolId.toString()) {
                if (updatedPools.length > 0) {
                    setSelectedPoolId(updatedPools[0].id.toString());
                } else {
                    setSelectedPoolId('');
                    setInvestors([]);
                    setReport(null);
                }
            }
        } catch (error) {
            console.error('Error deleting pool:', error);
        }
    };

    const generatePoolPdf = async (report: InvestorReport, pool: InvestorPool | undefined, payouts: InvestorPayout[], credits: Credit[]) => {
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
                        Отчёт по пулу инвесторов: ${pool?.name || 'Неизвестный пул'}
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
                        Финансовая информация пула
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        ${createCard(
                            investmentSvg,
                            formatMoney(report.investment.toString()),
                            'Общая инвестиция'
                        )}
                        
                        ${createCard(
                            activeCreditsSvg,
                            report.activeCreditsAmount.toString(),
                            'Незакрытые договоры'
                        )}
                        
                        ${createCard(
                            investorIncomeScg,
                            formatMoney(report.investorIncome.toString()),
                            'Доход инвесторов'
                        )}
                        
                        ${createCard(
                            selfIncomeSvg,
                            formatMoney(report.selfIncome.toString()),
                            'Собственный доход'
                        )}                            

                        ${createCard(
                            commonIncomeSvg,
                            formatMoney((report.allSelfIncome).toString()),
                            'Общий доход'
                        )}

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
                        История выплат пула
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

    const exportPoolToPdf = async () => {
        if (!report || !selectedPoolId) return;
        
        try {
            const currentPool = pools.find(pool => pool.id === Number(selectedPoolId));
            const credits = data?.items || [];
            
            const pdfBlob = await generatePoolPdf(report, currentPool, payouts, credits);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfUrl;
            downloadLink.download = `Отчет_пула_${currentPool?.name || 'Без_названия'}_${formatDate(new Date().toISOString())}.pdf`;
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
        if (!report || !selectedPoolId) return;
        
        try {
            const currentPool = pools.find(pool => pool.id === Number(selectedPoolId));
            const credits = data?.items || [];
            
            const pdfBlob = await generatePoolPdf(report, currentPool, payouts, credits);
            
            if (navigator.share && navigator.canShare && navigator.canShare({ 
                files: [new File([pdfBlob], `Отчет_пула_${currentPool?.name || 'Без_названия'}.pdf`, { type: 'application/pdf' })] 
            })) {
                await navigator.share({
                    title: `Отчёт пула ${currentPool?.name || 'Без названия'}`,
                    text: `Финансовый отчет по пулу инвесторов ${currentPool?.name}`,
                    files: [new File([pdfBlob], `Отчет_пула_${currentPool?.name || 'Без_названия'}.pdf`, { type: 'application/pdf' })]
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: `Отчёт пула ${currentPool?.name || 'Без названия'}`,
                    text: `Финансовый отчет по пулу инвесторов ${currentPool?.name}. Инвестиция: ${formatMoney(report.investment.toString())}, Общий доход: ${formatMoney((report.allSelfIncome).toString())}`,
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
        if (!selectedInvestorForPayout || !payoutAmount || !report) return;
        
        const numericAmount = Number(payoutAmount.replace(/\D/g, ''));
        
        try {
            await addPayout({
                investorId: selectedInvestorForPayout.id,
                amount: numericAmount,
                payoutSource: payoutSource
            });
            setIsPayoutModalOpen(false);
            setPayoutAmount('');
            
            await reloadData();
            
        } catch (error) {
            console.error('Payout error:', error);
        }
    };

    const getMaxPayoutAmount = (investor: Investor | null) => {
        if (!investor) return 0;
        
        if (investor.isBlocked) {
            return report?.balance || 0;
        }
        
        return investor.currentIncome || 0;
    };

    const getCurrentIncome = (investor: Investor | null) => {
        if (!investor) return 0;
        return investor.currentIncome || 0;
    };

    const tabs = [
        { id: 'investors', label: 'Инвесторы' },
        { id: 'payouts', label: 'История выплат' },
        { id: 'credits', label: 'Договоры' },
        { id: 'contributions', label: 'Инвестиции' },
    ];

    const dataTabs = [
        { id: 'general', label: 'Общие данные' },
        { id: 'expected', label: 'Ожидаемый доход' },
        { id: 'current', label: 'Текущий доход' }
    ];

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        
        // Если поле очищено, сбрасываем фильтр
        if (!value) {
            handleClearFilter();
        }
    };

    const handleClearFilter = () => {
        setSelectedInvestorForFilter(null);
        setSearchValue('');
        
        // Сбрасываем пагинацию в зависимости от активной вкладки
        if (activeTab === 'credits') {
            setCreditsPage(1);
            if (selectedPoolId) {
                getCredits({
                    investorPoolId: Number(selectedPoolId),
                    page: 1,
                    pageSize: pageSize
                }).then(data => {
                    setFilteredCredits(null);
                });
            }
        } else if (activeTab === 'payouts') {
            setPayoutsPage(1);
            setFilteredPayouts(payouts); // Сбрасываем фильтр выплат
        } else if (activeTab === 'contributions') {
            setContributionsPage(1);
        }
    };

    const handleDeletePayout = async (id: number) => {
        try {
            await removePayout(id);
            if (selectedInvestorId) {
                const updatedReport = await getInvestorPoolReport(Number(selectedInvestorId));
                setReport(updatedReport);
            }
        } catch (error) {
            console.error('Delete payout error:', error);
        }
    };

    const payoutTableData = payouts.map((payout: InvestorPayout) => [
        formatDate(payout.payoutDate),
        payout.employeeFullName,
        payout.investorFullName,
        formatMoney(payout.amount.toString()),
        <DeleteButton onClick={() => handleDeletePayout(payout.id)}></DeleteButton>
    ]);

    const creditsTableData = (filteredCredits?.items || data?.items || []).map((credit: Credit) => {
        return [
            credit.id,
            formatDate(credit.creditDate.toString()),
            credit.clientFullName,
            credit.clientPhone,
            formatMoney(credit.accured.toString()),
            formatMoney(credit.payed.toString()),
            formatMoney(credit.rest.toString()),
            formatMoney(credit.debt.toString()),
        ];
    });

    const investorCreditsTableData = investorCreditsData?.items.map((credit: Credit) => {
        const hasDebt = credit.debt > 0;
        const isActive = credit.isActive;
        
        return [
            credit.id,
            formatDate(credit.creditDate.toString()),
            credit.clientFullName,
            credit.clientPhone,
            formatMoney(credit.accured.toString()),
            formatMoney(credit.payed.toString()),
            formatMoney(credit.rest.toString()),
            formatMoney(credit.debt.toString()),
        ];
    }) || [];

    const rowStyles = (filteredCredits?.items || data?.items || []).reduce((styles, credit, index) => {
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
            <ReportCard>
                <IconContainer>
                    <Icon src={commonIncomeSvg} alt="Total income" />
                </IconContainer>
                <ReportValue>{formatMoney((report.allSelfIncome).toString())}</ReportValue>
                <ReportLabel>Общий доход</ReportLabel>
            </ReportCard>
        </>
    );

    const renderCurrentIncomeCards = () => (
        <>
            <ReportCard>
                <IconContainer>
                    <Icon src={investorIncomeScg} alt="Investor income" />
                </IconContainer>
                <ReportValue>{formatMoney(report.investorPaymentIncome?.toString() || '0')}</ReportValue>
                <ReportLabel>Текущий доход пула</ReportLabel>
            </ReportCard>

            <ReportCard>
                <IconContainer>
                    <Icon src={selfIncomeSvg} alt="Self income" />
                </IconContainer>
                <ReportValue>{formatMoney(report.selfPaymentIncome?.toString() || '0')}</ReportValue>
                <ReportLabel>Текущий собственный доход</ReportLabel>
            </ReportCard>

            <ReportCard>
                <IconContainer>
                    <Icon src={paymentIncomeSvg} alt="paymentIncome" />
                </IconContainer>
                <ReportValue>{formatMoney(report.paymentIncome.toString())}</ReportValue>
                <ReportLabel>Текущий доход</ReportLabel>
            </ReportCard>
        </>
    );

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Пулы инвесторов</CustomTitle>
                <ExportButton 
                    onClick={exportPoolToPdf}
                />
                <ExportButton
                    children={"Поделиться"}
                    icon={<ShareIcon />}
                    onClick={handleShareClick} 
                    disabled={!report}
                />
            </TitleField>

            <ContentContainer>
                <PoolTabsContainer>
                    <PoolTabsHeader>
                        <PoolTabsList>
                            {pools.map(pool => (
                                <PoolTabItem 
                                    key={pool.id}
                                    $isActive={selectedPoolId === pool.id.toString()}
                                    onClick={() => setSelectedPoolId(pool.id.toString())}
                                >
                                    {pool.name}
                                    {selectedPoolId === pool.id.toString() && <ActiveTabIndicator />}
                                    
                                    <PoolActions>
                                        <EditButton 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const currentPool = pools.find(pool => pool.id === Number(selectedPoolId));
                                                setNewPoolName(currentPool?.name || '');
                                                setNewPoolPie(currentPool?.pie || 0);
                                                setIsEditPoolModalOpen(true);
                                            }} 
                                        />
                                        <DeleteButton 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Удалить пул "${pool.name}"?`)) {
                                                    setSelectedPoolId(pool.id.toString());
                                                    handleDeletePool();
                                                }
                                            }} 
                                        />
                                    </PoolActions>
                                </PoolTabItem>
                            ))}
                        </PoolTabsList>
                        <AddButton 
                            onClick={() => setIsCreatePoolModalOpen(true)}
                            tooltip="Добавить пул"
                        />
                    </PoolTabsHeader>
                    
                    {report && (
                        <>
                            <CreationDate>
                                Пул создан {formatDate(report.createdAt)}
                            </CreationDate>

                            <TabsContainer>
                                <Tabs<'general' | 'expected' | 'current'>
                                    tabs={dataTabs}
                                    activeTab={dataTab}
                                    onChange={(tabId) => setDataTab(tabId)}
                                />
                            </TabsContainer>

                            <ReportDataContainer>
                                {dataTab === 'general' && renderGeneralCards()}
                                {dataTab === 'expected' && renderExpectedIncomeCards()}
                                {dataTab === 'current' && renderCurrentIncomeCards()}
                            </ReportDataContainer>
                        </>
                    )}
                </PoolTabsContainer>
                
                <TabsHeaderContainer>
                    <TabsContainer style={{ marginBottom: 0, flex: 1 }}>
                        <Tabs<'payouts' | 'credits' | 'investors' | 'contributions'>
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={(tabId) => {
                                setActiveTab(tabId);
                                // При переключении вкладок сбрасываем фильтр
                                if (tabId !== 'credits') {
                                    setSelectedInvestorForFilter(null);
                                    setSearchValue('');
                                }
                            }}
                            addButton={activeTab === 'investors' && pools.length > 0 ? (
                                <div style={{display: "flex", gap: "20px"}}>
                                    <DarkCyanButton 
                                        children='Реинвестировать'
                                        onClick={handleReinvest}
                                    />
                                    <AddButton 
                                        onClick={handleAddInvestor}
                                        tooltip="Добавить инвестора"
                                    />
                                </div>
                            ) : null}
                        />
                    </TabsContainer>
                    
                    <SearchContainer>
                        {(activeTab === 'credits' || activeTab === 'contributions' || activeTab === 'payouts') && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                                <InvestorSelect
                                    value={searchValue}
                                    poolId={Number.parseInt(selectedPoolId)}
                                    onChange={handleInvestorSelectChange}
                                    onInvestorSelect={handleInvestorSelect}
                                    placeholder="Инвесторы"
                                    customPlaceholder=""
                                    disabled={!selectedPoolId}
                                    hasError={false}
                                />
                            </div>
                        )}
                    </SearchContainer>
                </TabsHeaderContainer>

                {activeTab === 'payouts' && (
                    <>
                        <CustomTable 
                            columns={[
                                { name: "Дата выплаты", isSortable: true },
                                { name: "Выплатил", align: "left" },
                                { name: "Инвестор", align: "left" },
                                { name: "Выплата, руб", isSortable: true, align: "left" },
                                { name: "", align: "center" }
                            ]} 
                            data={filteredPayouts.map((payout: InvestorPayout) => [
                                formatDate(payout.payoutDate),
                                payout.employeeFullName,
                                payout.investorFullName,
                                formatMoney(payout.amount.toString()),
                                <DeleteButton onClick={() => handleDeletePayout(payout.id)}></DeleteButton>
                            ])}
                            isLoading={isPayoutsLoading}
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={filteredPayouts?.length || 0} 
                            />
                            <Pagination
                                total={filteredPayouts?.length || 0}
                                current={payoutsPage}
                                onChange={(page) => setPayoutsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                )}
                
                {activeTab === 'credits' && (
                    <>
                        {isCreditsLoading ? (
                            <div>Загрузка договоров...</div>
                        ) : (
                            <CustomTable 
                                columns={[
                                    { name: "№" },
                                    { name: "Дата договора" },
                                    { name: "Клиент", align: "left" },
                                    { name: "Телефон", align: "left" },
                                    { name: "Начислено",  align: "left" },
                                    { name: "Уплачено", align: "left" },
                                    { name: "Остаток", align: "left" },
                                    { name: "Долг", align: "left" },
                                ]} 
                                data={creditsTableData}
                                isLoading={isCreditsLoading}
                                rowStyles={rowStyles}
                            />
                        )}
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={data?.totalCount || 0} 
                            />
                            <Pagination
                                total={data?.totalCount || 0}
                                current={creditsPage}
                                onChange={(page) => setCreditsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                )}

                {activeTab === 'investors' && (
                    <>
                        <CustomTable 
                            columns={[
                                { name: "id", isHidden: true },
                                { name: "ФИО", align: "left" },
                                { name: "Телефон", align: "left" },
                                { name: "Инвестиция", align: "right" },
                                { name: "Доля", align: "right" },
                                { name: "Текущий доход", align: "right" },
                                { name: "", align: "center" },
                                { name: "", align: "center" },
                                { name: "", align: "center" }
                            ]} 
                            data={investorsTableData}
                            isLoading={isLoading}
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={investorsData?.totalCount || 0} 
                            />
                            <Pagination
                                total={investorsData?.totalCount || 0}
                                current={investorsPage}
                                onChange={(page) => setInvestorsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                        <InvestorModal
                            mode={currentInvestor ? 'edit-pool' : 'create-pool'}
                            isOpen={isInvestorModalOpen}
                            onClose={() => setIsInvestorModalOpen(false)}
                            onSubmit={handleInvestorSubmit}
                            initialData={currentInvestor ? {
                                id: currentInvestor.id,
                                nickname: currentInvestor.nickname,
                                fullName: currentInvestor.fullName,
                                phoneNumber: currentInvestor.phoneNumber,
                                investorPie: currentInvestor.investorPie,
                                investmentAmount: currentInvestor.investmentAmount,
                                balance: currentInvestor.balance,
                                isCompany: currentInvestor.isCompany,
                                isBlocked: currentInvestor.isBlocked,
                                poolId: currentInvestor.poolId,
                                activeUntil: currentInvestor.activeUntil
                            } : undefined}
                        />
                    </>
                )}

                {activeTab === 'contributions' && (
                    <>  
                        <CustomTable 
                            columns={[
                                { name: "Дата", isSortable: true },
                                { name: "Инвестор", align: "left" },
                                { name: "Сумма", align: "right" },
                                { name: "", align: "center" }
                            ]} 
                            data={contributionsTableData}
                            isLoading={isContributionsLoading}
                        />
                        <PaginationLayout>
                            <CountInfoTitle 
                                total={
                                    selectedInvestorForFilter 
                                        ? (filteredContributions?.totalCount || 0)
                                        : (contributionsData?.totalCount || 0)
                                } 
                            />
                            <Pagination
                                total={
                                    selectedInvestorForFilter 
                                        ? (filteredContributions?.totalCount || 0)
                                        : (contributionsData?.totalCount || 0)
                                }
                                current={contributionsPage}
                                onChange={(page) => setContributionsPage(page)}
                                itemsPerPage={pageSize}
                            />
                        </PaginationLayout>
                    </>
                )}

                {isInvestorCreditsModalOpen && selectedInvestorForCredits && (
                    <BaseModal
                        title={`Договоры инвестора`}
                        onClose={() => {
                            setIsInvestorCreditsModalOpen(false);
                            setSelectedInvestorForCredits(null);
                            setInvestorCreditsData(null);
                            setInvestorsCreditsPage(1);
                        }}
                        onCancel={() => {
                            setIsInvestorCreditsModalOpen(false);
                            setSelectedInvestorForCredits(null);
                            setInvestorCreditsData(null);
                            setInvestorsCreditsPage(1);
                        }}
                        onSave={() => setIsInvestorCreditsModalOpen(false)}
                        isSaveDisabled={false}
                        mode="view"
                        width="90vw"
                    >
                        {isInvestorCreditsLoading ? (
                            <LoadingMessage>Загрузка...</LoadingMessage>
                        ) : !investorCreditsData || investorCreditsData.items.length === 0 ? (
                            <NoDataMessage>У инвестора нет договоров</NoDataMessage>
                        ) : (
                            <CreditsTableContainer>
                                <CustomTable 
                                    columns={[
                                        { name: "№" },
                                        { name: "Дата договора" },
                                        { name: "Клиент", align: "left" },
                                        { name: "Телефон", align: "left" },
                                        { name: "Начислено", align: "right" },
                                        { name: "Уплачено", align: "right" },
                                        { name: "Остаток", align: "right" },
                                        { name: "Долг", align: "right" },
                                    ]} 
                                    data={investorCreditsTableData}
                                    isLoading={false}
                                />
                                <PaginationLayout>
                                    <CountInfoTitle 
                                        total={investorCreditsData?.totalCount || 0} 
                                    />
                                    <Pagination
                                        total={investorCreditsData?.totalCount || 0}
                                        current={investorsCreditsPage}
                                        onChange={(page) => {
                                            setInvestorsCreditsPage(page);
                                            // Перезагружаем данные при изменении страницы
                                            if (selectedInvestorForCredits) {
                                                getCreditsByInvestorId(selectedInvestorForCredits.id, page, pageSize)
                                                    .then(data => setInvestorCreditsData(data));
                                            }
                                        }}
                                        itemsPerPage={pageSize}
                                    />
                                </PaginationLayout>
                            </CreditsTableContainer>
                        )}
                    </BaseModal>
                )}

                <PayoutModal
                    isOpen={isPayoutModalOpen}
                    onClose={() => setIsPayoutModalOpen(false)}
                    amount={payoutAmount}
                    onAmountChange={setPayoutAmount}
                    onSubmit={handlePayoutSubmit}
                    maxAmount={getMaxPayoutAmount(selectedInvestorForPayout)}
                    balance={report?.balance || 0}
                    isLoading={isPayoutsLoading}
                    currentIncome={getCurrentIncome(selectedInvestorForPayout)}
                    poolSelfIncome={selectedInvestorForPayout?.isCompanyPool ? report?.selfPaymentIncome || 0 : null}
                    investment={selectedInvestorForPayout?.investmentAmount || 0}
                    firstContribution={selectedInvestorForPayout?.firstContribution || null}
                    payoutSource={payoutSource}
                    onPayoutSourceChange={setPayoutSource}
                    isCompany={false}
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
                        investmentAmount: currentInvestor.investmentAmount,
                        balance: currentInvestor.balance,
                        isCompany: currentInvestor.isCompany,
                        isBlocked: currentInvestor.isBlocked,
                        poolId: currentInvestor.poolId
                    } : undefined}
                />

                <CreatePoolModal
                    isOpen={isCreatePoolModalOpen}
                    onClose={() => setIsCreatePoolModalOpen(false)}
                    title="Создать новый пул"
                    value={newPoolName}
                    pieValue={newPoolPie}
                    onChange={setNewPoolName}
                    onPieChange={setNewPoolPie}
                    onSubmit={handleCreatePool}
                    submitText="Создать"
                    showPieField={true}
                />

                <CreatePoolModal
                    isOpen={isEditPoolModalOpen}
                    onClose={() => setIsEditPoolModalOpen(false)}
                    title="Редактировать пул"
                    value={newPoolName}
                    pieValue={newPoolPie}
                    onChange={setNewPoolName}
                    onPieChange={setNewPoolPie}
                    onSubmit={handleUpdatePoolName}
                    submitText="Сохранить"
                    showPieField={true}
                />

                {isInvestmentModalOpen && selectedInvestorForInvestment && (
                    <BaseModal
                        title={`Добавить инвестицию для ${selectedInvestorForInvestment.fullName || selectedInvestorForInvestment.nickname}`}
                        onClose={() => setIsInvestmentModalOpen(false)}
                        onCancel={() => setIsInvestmentModalOpen(false)}
                        onSave={handleSubmitInvestment}
                        isSaveDisabled={!investmentAmount || isNaN(parseFloat(investmentAmount)) || parseFloat(investmentAmount) <= 0}
                        mode="edit"
                    >
                        <form onSubmit={handleSubmitInvestment} style={{ padding: '20px' }}>
                            <InputRow>
                                <InputLabel>Сумма инвестиции:</InputLabel>
                                <InputContainer>
                                    <CustomInput
                                        name="investmentAmount"
                                        inputType="rubles"
                                        placeholder="Сумма"
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                    />
                                </InputContainer>
                            </InputRow>
                        </form>
                    </BaseModal>
                )}
            </ContentContainer>
        </PageLayout>
    );
};

// Стили для модального окна кредитов инвестора
const InvestorCreditsContainer = styled.div`
    max-height: 70vh;
    overflow-y: auto;
`;

const InvestorInfo = styled.div`
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid #dee2e6;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    &:last-child {
        margin-bottom: 0;
    }
`;

const InfoLabel = styled.span`
    font-weight: 600;
    color: #495057;
    min-width: 140px;
`;

const InfoValue = styled.span`
    color: #212529;
    font-size: 15px;
`;

const CreditsTableContainer = styled.div`
    overflow: hidden;
`;

const LoadingMessage = styled.div`
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-size: 16px;
`;

const NoDataMessage = styled.div`
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-size: 16px;
    background: #f8f9fa;
    border-radius: 8px;
`;

const CreditsCount = styled.div`
    padding: 16px;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
    font-weight: 600;
    color: #495057;
    text-align: right;
`;

const PoolTabsContainer = styled.div`
    margin-bottom: 24px;
`;

const PoolTabItem = styled.li<{ $isActive: boolean }>`
    position: relative;
    padding: 12px 0;
    cursor: pointer;
    font-size: 14px;
    font-weight: ${props => props.$isActive ? '600' : '400'};
    color: ${props => props.$isActive ? 'rgba(0, 125, 136, 1)' : 'rgba(107, 114, 128, 1)'};
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        color: rgba(0, 125, 136, 0.8);
    }
`;

const ActiveTabIndicator = styled.div`
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: rgba(0, 125, 136, 1);
    border-radius: 2px 2px 0 0;
`;

const PoolTabsHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid rgba(209, 213, 219, 1);
    padding-bottom: 8px;
`;

const PoolTabsList = styled.ul`
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 24px;
    flex: 1;
`;

const PoolActions = styled.div`
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    
    ${PoolTabItem}:hover & {
        opacity: 1;
    }
    
    ${PoolTabItem}[$isActive="true"] & {
        opacity: 1;
    }
`;

const TabsContainer = styled.div`
    margin: 30px 0 20px;
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
    align-items: flex-start;
    justify-content: left;
    position: relative;
    padding-bottom: 20px;
    max-width: 600px;
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.00001 2.50216C8.99998 1.91022 9.20982 1.33743 9.59224 0.885601C9.97466 0.43377 10.5049 0.132162 11.0887 0.0343785C11.6725 -0.0634049 12.2721 0.0489702 12.7809 0.351533C13.2896 0.654095 13.6747 1.12725 13.8675 1.6869C14.0604 2.24655 14.0485 2.85645 13.8341 3.4082C13.6197 3.95995 13.2167 4.41782 12.6965 4.70044C12.1764 4.98305 11.5729 5.0721 10.9934 4.95176C10.4138 4.83141 9.89563 4.50948 9.53101 4.04316L4.91502 6.35116C5.02912 6.77597 5.02912 7.22336 4.91502 7.64816L9.53302 9.95816C9.91574 9.47098 10.4657 9.14326 11.0764 9.03854C11.687 8.93382 12.3147 9.05956 12.8379 9.39139C13.3611 9.72321 13.7424 10.2375 13.908 10.8345C14.0736 11.4315 14.0116 12.0687 13.734 12.6226C13.4564 13.1765 12.9831 13.6076 12.4057 13.8323C11.8284 14.057 11.1882 14.0594 10.6092 13.8389C10.0302 13.6184 9.55374 13.1908 9.27213 12.6389C8.99051 12.0871 8.92383 11.4504 9.08502 10.8522L4.46702 8.54216C4.14602 8.95136 3.7054 9.25027 3.20652 9.39725C2.70765 9.54423 2.17535 9.53196 1.68377 9.36216C1.19219 9.19236 0.765807 8.87348 0.464002 8.44992C0.162198 8.02637 0 7.51924 0 6.99916C0 6.47908 0.162198 5.97195 0.464002 5.5484C0.765807 5.12485 1.19219 4.80596 1.68377 4.63616C2.17535 4.46636 2.70765 4.45409 3.20652 4.60107C3.7054 4.74805 4.14602 5.04696 4.46702 5.45616L9.08502 3.14916C9.02854 2.93813 8.99996 2.72062 9.00001 2.50216ZM11.502 1.00016C11.1038 1.00016 10.7219 1.15835 10.4403 1.43994C10.1587 1.72153 10.0005 2.10344 10.0005 2.50166C10.0005 2.89988 10.1587 3.2818 10.4403 3.56338C10.7219 3.84497 11.1038 4.00316 11.502 4.00316C11.9002 4.00316 12.2821 3.84497 12.5637 3.56338C12.8453 3.2818 13.0035 2.89988 13.0035 2.50166C13.0035 2.10344 12.8453 1.72153 12.5637 1.43994C12.2821 1.15835 11.9002 1.00016 11.502 1.00016ZM11.5 10.0002C11.1022 10.0002 10.7207 10.1582 10.4394 10.4395C10.1581 10.7208 10 11.1023 10 11.5002C10 11.898 10.1581 12.2795 10.4394 12.5608C10.7207 12.8421 11.1022 13.0002 11.5 13.0002C11.8978 13.0002 12.2794 12.8421 12.5607 12.5608C12.842 12.2795 13 11.898 13 11.5002C13 11.1023 12.842 10.7208 12.5607 10.4395C12.2794 10.1582 11.8978 10.0002 11.5 10.0002ZM1.00002 7.00016C1.00002 7.19714 1.03881 7.3922 1.1142 7.57419C1.18958 7.75617 1.30007 7.92153 1.43936 8.06082C1.57864 8.20011 1.744 8.3106 1.92599 8.38598C2.10798 8.46136 2.30303 8.50016 2.50002 8.50016C2.697 8.50016 2.89205 8.46136 3.07404 8.38598C3.25603 8.3106 3.42139 8.20011 3.56068 8.06082C3.69996 7.92153 3.81045 7.75617 3.88583 7.57419C3.96122 7.3922 4.00002 7.19714 4.00002 7.00016C4.00002 6.60234 3.84198 6.22081 3.56068 5.9395C3.27937 5.6582 2.89784 5.50016 2.50002 5.50016C2.10219 5.50016 1.72066 5.6582 1.43936 5.9395C1.15805 6.22081 1.00002 6.60234 1.00002 7.00016Z" fill="black"/>
    </svg>
);

const DoubleClickCell = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 0;
    
    &:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }
    
    a {
        text-decoration: none;
        color: inherit;
        
        &:hover {
            text-decoration: underline;
        }
    }
`;

const TabsHeaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin: 30px 0 20px;
    width: 100%;
`;

const SearchContainer = styled.div`
    min-width: 300px;
    max-width: 400px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    
    @media (max-width: 768px) {
        min-width: 200px;
        max-width: 300px;
    }
`;

export default InvestorsPoolPage;