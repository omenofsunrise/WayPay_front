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

    const { hasRole, hasPermission } = useAuth();

    useEffect(() => {
        localStorage.setItem('financeActiveTab', activeTab);
    }, [activeTab]);

    const tabs: Tab[] = [
        { id: "Бюджет", label: "Бюджет" },
        { id: "Платежи", label: "Платежи" },
        { id: "Карточки", label: "Карточки" }
    ];

    // Добавляем вкладку "Сотрудники" если есть соответствующие права
    if (hasPermission('MANAGE_ACCOUNTING', true) || hasRole('директор') || hasRole('суперадмин')) {
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