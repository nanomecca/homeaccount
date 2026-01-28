'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';
import { getTransactions, getCategories } from '@/lib/db-client';

export default function Report() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<'monthly' | 'category'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      setIsLoading(false);
    }
  }, [transactions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
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

  // 월간 리포트 데이터
  const getMonthlyData = () => {
    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === selectedYear &&
        transactionDate.getMonth() + 1 === selectedMonth
      );
    });

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 카테고리별 지출 데이터 (원형 그래프용)
    const expenseByCategory = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const pieData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      transactions: monthlyTransactions,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pieData,
    };
  };

  // 카테고리별 리포트 데이터
  const getCategoryReportData = () => {
    if (!selectedCategory || !startDate || !endDate) {
      return null;
    }

    const categoryTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.category === selectedCategory &&
        transactionDate >= new Date(startDate) &&
        transactionDate <= new Date(endDate)
      );
    });

    const totalAmount = categoryTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // 월별 집계
    const monthlyData = categoryTransactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    // TOP 3 달
    const top3Months = Object.entries(monthlyData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([month, amount]) => ({
        month,
        amount,
        displayMonth: `${month.split('-')[0]}년 ${parseInt(month.split('-')[1])}월`,
      }));

    return {
      totalAmount,
      top3Months,
      transactionCount: categoryTransactions.length,
    };
  };

  const monthlyData = getMonthlyData();
  const categoryReportData = getCategoryReportData();

  // 원형 그래프 색상
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#8dd1e1',
    '#d084d0',
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const allCategories = categories.map((cat) => cat.name);

  return (
    <div className="space-y-6">
      {/* 리포트 타입 선택 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-md font-medium ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            월간 리포트
          </button>
          <button
            onClick={() => setReportType('category')}
            className={`px-4 py-2 rounded-md font-medium ${
              reportType === 'category'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            카테고리 리포트
          </button>
        </div>
      </div>

      {reportType === 'monthly' ? (
        /* 월간 리포트 */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">월간 리포트</h2>
          
          <div className="flex gap-4 items-center mb-6">
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

          {isLoading ? (
            <p className="text-center py-8 text-gray-600">로딩 중...</p>
          ) : (
            <>
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 수입</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(monthlyData.totalIncome)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">총 지출</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(monthlyData.totalExpense)}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    monthlyData.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                  }`}
                >
                  <p className="text-sm text-gray-600 mb-1">잔액</p>
                  <p
                    className={`text-2xl font-bold ${
                      monthlyData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    {formatAmount(monthlyData.balance)}
                  </p>
                </div>
              </div>

              {/* 원형 그래프 */}
              {monthlyData.pieData.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">지출 카테고리별 분포</h3>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={monthlyData.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {monthlyData.pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatAmount(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  {selectedYear}년 {selectedMonth}월에 지출 내역이 없습니다.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        /* 카테고리 리포트 */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">카테고리 리포트</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">카테고리 선택</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">카테고리를 선택하세요</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">시작 날짜</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">종료 날짜</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {categoryReportData ? (
            <div className="space-y-6">
              {/* 총합 */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">기간별 총합</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatAmount(categoryReportData.totalAmount)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  거래 건수: {categoryReportData.transactionCount}건
                </p>
              </div>

              {/* TOP 3 달 */}
              {categoryReportData.top3Months.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">TOP 3 많이 사용한 달</h3>
                  <div className="space-y-3">
                    {categoryReportData.top3Months.map((item, index) => (
                      <div
                        key={item.month}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{item.displayMonth}</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  선택한 기간에 해당 카테고리의 거래 내역이 없습니다.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              카테고리와 기간을 선택해주세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
