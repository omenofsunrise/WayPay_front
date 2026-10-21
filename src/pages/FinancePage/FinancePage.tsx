import { useEffect, useState } from 'react';
import PageLayout from '../../components/ui/Layouts/PageLayout';
import BudgetPage from './BudgetPage';
import FinanceProfilePage from './FinanceProfilePage';
import PaymentIncomePage from './PaymentIncomePage';
import type { Tab } from '../../components/ui/fields/Tabs';
import Tabs from '../../components/ui/fields/Tabs';
import { useAuth } from '../../сontext/AuthContext';
import BankCardsPage from './BankCardsPage';

const FinancePage = () => {
    const [activeTab, setActiveTab] = useState<string>(() => {
        return localStorage.getItem('financeActiveTab') || "Бюджет";
    });

    const { hasRole, hasPermission, denyPermission } = useAuth();

    useEffect(() => {
        localStorage.setItem('financeActiveTab', activeTab);
    }, [activeTab]);

    // Вкладку могли скрыть, пока она была выбрана: переводим на первую доступную.
    useEffect(() => {
        if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);

    // Запрещающие права: у кого права нет — видит вкладку, как и раньше.
    const tabs: Tab[] = [
        { id: "Бюджет", label: "Бюджет", hidden: !denyPermission('FORBID_FINANCE_BUDGET') },
        { id: "Платежи", label: "Платежи", hidden: !denyPermission('FORBID_FINANCE_PAYMENTS') },
        { id: "Карточки", label: "Карточки", hidden: !denyPermission('FORBID_FINANCE_CARDS') }
    ].filter((tab) => !tab.hidden).map(({ id, label }) => ({ id, label }));

    // Добавляем вкладку "Сотрудники" если есть соответствующие права
    if ((hasPermission('MANAGE_ACCOUNTING', true) || hasRole('директор') || hasRole('суперадмин'))
        && denyPermission('FORBID_FINANCE_EMPLOYEES')) {
        tabs.push({ id: "Сотрудники", label: "Сотрудники" });
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "Бюджет":
                return <BudgetPage />;
            case "Платежи":
                return <PaymentIncomePage />;
            case "Сотрудники":
                return <FinanceProfilePage onViewEmployee={() => {}} />;
            case "Карточки":
                return <BankCardsPage />

            default:
                return <BudgetPage />;
        }
    };

    return (
        <PageLayout>
            <Tabs 
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                fontSize={18}
            />
            {renderTabContent()}
        </PageLayout>
    );
};

export default FinancePage;