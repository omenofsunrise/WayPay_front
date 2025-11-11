import React from 'react';

const FinanceProfilePage = () => {
    const financialData = [
        { id: 1, month: 'Январь 2024', income: 500000, expenses: 350000, profit: 150000 },
        { id: 2, month: 'Февраль 2024', income: 520000, expenses: 360000, profit: 160000 },
        { id: 3, month: 'Март 2024', income: 480000, expenses: 340000, profit: 140000 },
        { id: 4, month: 'Апрель 2024', income: 550000, expenses: 380000, profit: 170000 },
    ];

    const totalIncome = financialData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = financialData.reduce((sum, item) => sum + item.expenses, 0);
    const totalProfit = financialData.reduce((sum, item) => sum + item.profit, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Финансовый раздел</h1>
            
        </div>
    );
};

export default FinanceProfilePage;