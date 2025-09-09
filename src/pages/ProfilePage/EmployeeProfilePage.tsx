import styled from 'styled-components';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import CustomTitle from '../../components/ui/Text/CustomTitle';
import ModalInfoTitle from '../../components/ui/Text/ModalInfoTitle';
import UserContainer from '../../components/Profile/UserContainer';
import ColumnChart from '../../components/Dashboards/ColumnChart';
import ScatterPlot from '../../components/Dashboards/ScatterPlot';
import ResultsContainer from '../../components/Profile/ResultsContainer';
import creditsAmountSvg from '../../assets/ui/analitic/creditsAmount.svg';
import paymentsSvg from '../../assets/ui/analitic/payments.svg';
import { useEmployee } from '../../api/hooks/useEmployee';
import { useEffect, useMemo, useState } from 'react';
import type { Employee } from '../../api/types/employee';
import { useAuth } from '../../сontext/AuthContext';
import Checkbox from '../../components/ui/CheckBoxes/Checkbox';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../api/utils/auth-storage';

interface EmployeeProfilePageProps {
    employeeId?: number;
}

const EmployeeProfilePage = ({ employeeId }: EmployeeProfilePageProps) => {
    const { 
        authInfo,
        creditsStats, 
        paymentsStats,
        employeeCreditsStats,
        employeePaymentsStats,
        fetchCreditsStats, 
        fetchPaymentsStats,
        fetchEmployeeById,
        fetchEmployeeCreditsStats,
        fetchEmployeePaymentsStats,
        togglePermission,
        revokeSession
    } = useEmployee();
    const { hasRole } = useAuth();
    const [ setIsUpdatingPermissions] = useState(false);
    const employeePermissions = useMemo(() => [
        {
            code: 'CREATE_CREDITS',
            label: 'Создание договоров',
            roles: ['сотрудник', 'бухгалтер']
        },
        {
            code: 'DELETE_CREDITS',
            label: 'Удаление договоров',
            roles: ['сотрудник', 'бухгалтер']
        }
    ], []);

    const adminPermissions = useMemo(() => [
        {
            code: 'VIEW_ANALYTIC',
            label: 'Просмотр аналитики',
            roles: ['админ']
        }
    ], []);
    
    const canEditProfile = useMemo(() => {
        if (!employeeId) {
            return hasRole('директор') || hasRole('суперадмин') || hasRole('админ');
        } else {
            return hasRole('директор') || hasRole('суперадмин');
        }
    }, [employeeId, hasRole]);

    const handleTogglePermission = async (permissionCode: string) => {
        
        try {
            await togglePermission(employeeId, permissionCode);
            const updatedEmployee = await fetchEmployeeById(employeeId);
            setEmployee(updatedEmployee);
        } catch (error) {
            console.error('Error updating permission:', error);
        } finally {
        }
    };
    
    const handleLogout = () => {
    revokeSession();
    
    authStorage.clear();
    
    if (!employeeId) {
      window.dispatchEvent(new Event('storage'));
      
      window.location.href = '/auth';
    }
  };
                                
    useEffect(() => {
        if (employeeId) {
            localStorage.setItem('viewingEmployeeId', employeeId.toString());
        } else {
            localStorage.removeItem('viewingEmployeeId');
        }
    }, [employeeId]);

    useEffect(() => {
            if (employeeId) {
                fetchEmployeeById(employeeId).then(setEmployee);
                fetchEmployeeCreditsStats(employeeId, 12);
                fetchEmployeePaymentsStats(employeeId, 12);
            } else {
                fetchCreditsStats(12);
                fetchPaymentsStats(12);
            }
    }, [employeeId]);
    
    const statsToUse = employeeId ? employeeCreditsStats : creditsStats;
    const paymentsToUse = employeeId ? employeePaymentsStats : paymentsStats;
    const [employee, setEmployee] = useState<Employee | null>(null);
    
    const canSetEmployeePermissions = employee && 
        (employee.role === 'сотрудник' || employee.role === 'бухгалтер');
    
    const canSetAdminPermissions = employee && 
        (employee.role === 'админ');

    const scatterPlotData = useMemo(() => {
        if (!statsToUse || statsToUse.length === 0) return [];
        
        return statsToUse.map((stat, index) => ({
            x: index + 1,
            y: stat.count,
            color: 'rgba(0, 125, 136, 1)',
            name: getMonthName(stat.month),
            value: stat.count
        }));
    }, [statsToUse]);

    const paymentsChartData = useMemo(() => 
        paymentsToUse.map(stat => ({
            label: getShortMonthName(stat.month),
            total: stat.total,
            bars: [
                { 
                    name: 'Неподтверждённые, руб', 
                    value: stat.notAssumed, 
                    color: 'rgba(209, 213, 219, 1)' 
                },
                { 
                    name: 'Подтверждённые, руб', 
                    value: stat.assumed, 
                    color: 'rgba(0, 125, 136, 1)' 
                },
            ]
        })),
    [paymentsToUse]);

    const showPermissionsPanel = employeeId && 
                            authInfo?.employee.id !== employeeId && 
                            (hasRole('суперадмин') || hasRole('директор') || 
                             (hasRole('админ') && employee?.role === 'сотрудник')) &&
                            (employee?.role === 'сотрудник' || 
                             employee?.role === 'бухгалтер' || 
                             employee?.role === 'админ');

    const { currentMonthCount, percentageChange: creditsPercentageChange } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const currentMonthStat = statsToUse.find(
            stat => stat.month === currentMonth && stat.year === currentYear
        );
        
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear--;
        }
        
        const prevMonthStat = statsToUse.find(
            stat => stat.month === prevMonth && stat.year === prevYear
        );

        const currentCount = currentMonthStat?.count || 0;
        const prevCount = prevMonthStat?.count || 0;
        
        let change = 0;
        let hasChange = false;
        
        if (prevCount > 0 && currentCount > 0) {
            change = ((currentCount - prevCount) / prevCount) * 100;
            hasChange = true;
        } else if (prevCount === 0 && currentCount > 0) {
            change = 100;
            hasChange = true;
        } else if (currentCount === 0 && prevCount > 0) {
            change = -100;
            hasChange = true;
        }

        return {
            currentMonthCount: currentCount,
            percentageChange: {
                value: Math.round(change),
                hasChange,
                isPositive: change > 0,
                isNeutral: change === 0
            }
        };
    }, [statsToUse]);

    const { currentMonthPayments, paymentsPercentageChange } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const currentMonthStat = paymentsToUse.find(
        stat => stat.month === currentMonth && stat.year === currentYear
    );
    
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
    }
    
    const prevMonthStat = paymentsToUse.find(
        stat => stat.month === prevMonth && stat.year === prevYear
    );

    const currentTotal = currentMonthStat?.total || 0;
    const prevTotal = prevMonthStat?.total || 0;
    
    let change = 0;
    let hasChange = false;
    
    if (prevTotal > 0 && currentTotal > 0) {
        change = ((currentTotal - prevTotal) / prevTotal) * 100;
        hasChange = true;
    } else if (prevTotal === 0 && currentTotal > 0) {
        change = 100;
        hasChange = true;
    } else if (currentTotal === 0 && prevTotal > 0) {
        change = -100;
        hasChange = true;
    }

    return {
        currentMonthPayments: currentTotal,
        paymentsPercentageChange: {
            value: Math.round(change),
            hasChange,
            isPositive: change > 0,
            isNeutral: change === 0
        }
    };
}, [paymentsToUse]);

    function getMonthName(month: number): string {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[month - 1] || '';
    }

    function getShortMonthName(month: number): string {
        const months = [
            'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
            'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
        ];
        return months[month - 1] || '';
    }

    function formatPaymentAmount(amount: number): string {
        return new Intl.NumberFormat('ru-RU', { 
            style: 'decimal',
            maximumFractionDigits: 0 
        }).format(amount) + ' ₽';
    }

    return (
        <PageLayout>
            <HeaderContainer>
                <CustomTitle style={{margin: "0"}}>
                    {employeeId ? `Профиль сотрудника` : `Мой профиль`}
                </CustomTitle>
                {!employeeId && (
                    <LogoutButton onClick={handleLogout}>
                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 0.625C7.72302 0.625247 7.93753 0.710644 8.0997 0.863742C8.26187 1.01684 8.35946 1.22608 8.37253 1.44872C8.3856 1.67136 8.31316 1.89058 8.17002 2.0616C8.02688 2.23262 7.82383 2.34253 7.60237 2.36888L7.5 2.375H3.125C2.91068 2.37503 2.70383 2.45371 2.54367 2.59613C2.38352 2.73854 2.2812 2.93478 2.25612 3.14762L2.25 3.25V13.75C2.25003 13.9643 2.32871 14.1712 2.47113 14.3313C2.61354 14.4915 2.80978 14.5938 3.02262 14.6189L3.125 14.625H7.0625C7.28552 14.6252 7.50003 14.7106 7.6622 14.8637C7.82437 15.0168 7.92196 15.2261 7.93503 15.4487C7.9481 15.6714 7.87566 15.8906 7.73252 16.0616C7.58938 16.2326 7.38633 16.3425 7.16487 16.3689L7.0625 16.375H3.125C2.45544 16.375 1.81117 16.1192 1.32402 15.6599C0.836869 15.2005 0.543656 14.5724 0.504375 13.904L0.5 13.75V3.25C0.499963 2.58044 0.755785 1.93617 1.21512 1.44902C1.67446 0.961869 2.30259 0.668656 2.971 0.629375L3.125 0.625H7.5ZM12.4936 5.406L14.9681 7.88138C15.1322 8.04546 15.2243 8.26798 15.2243 8.5C15.2243 8.73202 15.1322 8.95454 14.9681 9.11862L12.4936 11.594C12.3294 11.7581 12.1068 11.8502 11.8747 11.8501C11.6426 11.85 11.42 11.7577 11.2559 11.5936C11.0919 11.4294 10.9997 11.2067 10.9998 10.9746C10.9999 10.7425 11.0922 10.5199 11.2564 10.3559L12.2372 9.375H7.5C7.26794 9.375 7.04538 9.28281 6.88128 9.11872C6.71719 8.95462 6.625 8.73206 6.625 8.5C6.625 8.26794 6.71719 8.04538 6.88128 7.88128C7.04538 7.71719 7.26794 7.625 7.5 7.625H12.2372L11.2564 6.64412C11.0922 6.48006 10.9999 6.25748 10.9998 6.02537C10.9997 5.79326 11.0919 5.57062 11.2559 5.40644C11.42 5.24225 11.6426 5.14997 11.8747 5.14989C12.1068 5.1498 12.3294 5.24193 12.4936 5.406Z" fill="#50555C"/>
                        </svg>
                        <span>Выйти из аккаунта</span>
                    </LogoutButton>
                )}
            </HeaderContainer>
            <ModalInfoTitle style={{marginBottom: "0" }}>
                {employeeId ? 'Данные и статистика сотрудника' : 'Личные данные и статистика'}
            </ModalInfoTitle>
            
            <ProfileContent>
                <UserContainer 
                    employee={employeeId ? employee : authInfo?.employee} 
                    isCurrentUser={!employeeId}
                    allowEdit={canEditProfile}
                />
                
                <ChartWrapper style={{ height: "100%" }}>
                    <ColumnChart 
                        height={220}
                        title="Статистика платежей" 
                        data={paymentsChartData} 
                        maxValue={Math.max(...paymentsChartData.map(d => d.total), 100000)} 
                        step={Math.ceil(Math.max(...paymentsChartData.map(d => d.total), 100000) / 5)} 
                    />
                </ChartWrapper>
            </ProfileContent>
            <BottomSection>
                <ScatterPlotWrapper>
                    <ScatterPlot
                        title="Количество договоров"
                        data={scatterPlotData}
                        xAxisLabel=""
                        yAxisLabel=""
                        maxX={12}
                        maxY={Math.max(...scatterPlotData.map(d => d.y), 10)}
                        minY={0}
                        xStep={1}
                        yStep={Math.ceil(Math.max(...scatterPlotData.map(d => d.y), 10) / 5)}
                        height={220}
                        showLegend={false}
                        xAxisCustomLabels={statsToUse.map(stat => getShortMonthName(stat.month))}
                    />
                </ScatterPlotWrapper>
                
                <ResultsWrapper>
                    <ResultsContainer
                        icon={<img src={creditsAmountSvg} alt="Кредиты" />}
                        title="Кол-во договоров в этом месяце"
                        value={currentMonthCount.toString()}
                        percentageChange={creditsPercentageChange}
                    />
                    <ResultsContainer
                        icon={<img src={paymentsSvg} alt="Платежи" />}
                        title="Платежи в этом месяце"
                        value={formatPaymentAmount(currentMonthPayments)}
                        percentageChange={paymentsPercentageChange}
                    />
                </ResultsWrapper>
            </BottomSection>

            {showPermissionsPanel && (
                <PermissionsSection>
                    <ModalInfoTitle>Права пользователя</ModalInfoTitle>
                    
                    {canSetEmployeePermissions && (
                        <>
                            <PermissionsGrid>
                                {employeePermissions.map(permission => (
                                    <PermissionItem key={permission.code}>
                                        <Checkbox 
                                            checked={employee?.permissions?.some(p => p.code === permission.code) || false}
                                            onChange={() => handleTogglePermission(permission.code)}
                                        />
                                        <PermissionLabel>{permission.label}</PermissionLabel>
                                    </PermissionItem>
                                ))}
                            </PermissionsGrid>
                        </>
                    )}
                    
                    {canSetAdminPermissions && (
                        <>
                            <PermissionsGrid>
                                {adminPermissions.map(permission => (
                                    <PermissionItem key={permission.code}>
                                        <Checkbox 
                                            checked={employee?.permissions?.some(p => p.code === permission.code) || false}
                                            onChange={() => handleTogglePermission(permission.code)}
                                        />
                                        <PermissionLabel>{permission.label}</PermissionLabel>
                                    </PermissionItem>
                                ))}
                            </PermissionsGrid>
                        </>
                    )}
                </PermissionsSection>
            )}
        </PageLayout>
    );
};

const PermissionGroupTitle = styled.h4`
    margin: 15px 0 10px 0;
    color: #374151;
    font-size: 16px;
    font-weight: 600;
`;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

const LogoutButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #50555C;
    transition: all 0.2s ease;
    
    &:hover {
        background: #F9FAFB;
        border-color: #D1D5DB;
    }
    
    &:active {
        background: #F3F4F6;
    }
`;

const ProfileContent = styled.div`
    display: flex;
    gap: 15px;
    margin: 10px 0;

    @media (max-width: 1200px) {
        flex-direction: column;
    }
`;

const BottomSection = styled.div`
    display: flex;
    gap: 15px;
    margin: 0;
    
    @media (max-width: 1200px) {
        flex-direction: column;
    }
`;

const ChartWrapper = styled.div`
    flex: 4;
`;

const ScatterPlotWrapper = styled.div`
    flex: 2.5;
    min-height: 220px;
    position: relative;
`;

const ResultsWrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    
    & > div {
        flex: 1;
    }
`;

const PermissionsSection = styled.div`
    margin-top: 30px;
    padding-bottom: 20px;
    background: #FFFFFF;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const PermissionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
`;

const PermissionItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const PermissionLabel = styled.span`
    font-size: 14px;
    color: #374151;
`;

export default EmployeeProfilePage;