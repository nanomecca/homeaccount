'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { getTransactions } from '@/lib/db-client';

export default function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, [selectedYear, selectedMonth]);

  const loadMonthlyData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;
      
      const allTransactions = await getTransactions();
      const monthlyTransactions = allTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() === selectedYear &&
          transactionDate.getMonth() + 1 === selectedMonth
        );
      });
      
      setTransactions(monthlyTransactions);
    } catch (error) {
      console.error('월별 데이터 로드 실패:', error);
      alert('월별 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 월별 통계 계산
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // 카테고리별 지출 통계
  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // 카테고리별 수입 통계
  const incomeByCategory = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">월별 리포트</h2>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">년도</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded-md"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">월</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded-md"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-gray-600">로딩 중...</p>
      ) : (
        <>
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">총 수입</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">총 지출</p>
              <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense)}</p>
            </div>
            <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className="text-sm text-gray-600 mb-1">잔액</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatAmount(balance)}
              </p>
            </div>
          </div>

          {/* 카테고리별 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 수입 카테고리별 */}
            {Object.keys(incomeByCategory).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-700">수입 카테고리별</h3>
                <div className="space-y-2">
                  {Object.entries(incomeByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm">{category}</span>
                        <span className="font-semibold text-green-600">{formatAmount(amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 지출 카테고리별 */}
            {Object.keys(expenseByCategory).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-700">지출 카테고리별</h3>
                <div className="space-y-2">
                  {Object.entries(expenseByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm">{category}</span>
                        <span className="font-semibold text-red-600">{formatAmount(amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {transactions.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              {selectedYear}년 {selectedMonth}월에 거래 내역이 없습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
