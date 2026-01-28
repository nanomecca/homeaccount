'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell, LabelList } from 'recharts';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';
import { getTransactions, getCategories, getTransactionTypes } from '@/lib/db-client';

export default function Report() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<'monthly' | 'category'>('monthly');
  const [categoryYear, setCategoryYear] = useState(new Date().getFullYear());
  const [categoryMonth, setCategoryMonth] = useState(new Date().getMonth() + 1);
  const [categoryDateMode, setCategoryDateMode] = useState<'month' | 'range'>('month');
  const [expenseMainCategory, setExpenseMainCategory] = useState<string>('');
  const [expenseViewMode, setExpenseViewMode] = useState<'main' | 'sub'>('sub');

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
      const [transactionsData, categoriesData, typesData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getTransactionTypes(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setTypes(typesData);
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

    // 유형별 집계
    const byType = monthlyTransactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = 0;
      }
      acc[t.type] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const totalIncome = byType['income'] || 0;
    const totalExpense = byType['expense'] || 0;
    const totalOther = Object.entries(byType)
      .filter(([type]) => type !== 'income' && type !== 'expense')
      .reduce((sum, [, amount]) => sum + amount, 0);

    // 모든 유형별 데이터 (세로 막대 그래프용)
    const barData = Object.entries(byType)
      .map(([type, value]) => {
        const typeInfo = types.find(t => t.name === type);
        return {
          name: typeInfo ? typeInfo.display_name : type,
          value,
          type: type,
        };
      })
      .sort((a, b) => b.value - a.value);

    // 지출 카테고리별 데이터
    const expenseTransactions = monthlyTransactions.filter((t) => t.type === 'expense');
    
    // 대분류별 데이터
    const expenseByMainCategory = expenseTransactions.reduce((acc, t) => {
      const categoryInfo = categories.find(c => c.type === 'expense' && c.name === t.category);
      const mainCat = categoryInfo?.main_category || '';
      if (mainCat && (!expenseMainCategory || mainCat === expenseMainCategory)) {
        if (!acc[mainCat]) {
          acc[mainCat] = 0;
        }
        acc[mainCat] += Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    // 소분류별 데이터
    const expenseBySubCategory = expenseTransactions.reduce((acc, t) => {
      const categoryInfo = categories.find(c => c.type === 'expense' && c.name === t.category);
      const mainCat = categoryInfo?.main_category || '';
      if ((!expenseMainCategory || mainCat === expenseMainCategory)) {
        if (!acc[t.category]) {
          acc[t.category] = { value: 0, mainCategory: mainCat };
        }
        acc[t.category].value += Number(t.amount);
      }
      return acc;
    }, {} as Record<string, { value: number; mainCategory: string }>);

    // 선택된 모드에 따라 데이터 구성
    let expenseCategoryData: Array<{ name: string; value: number; percent: number; mainCategory?: string }> = [];
    
    if (expenseViewMode === 'main') {
      // 대분류별
      expenseCategoryData = Object.entries(expenseByMainCategory)
        .map(([name, value]) => ({
          name,
          value,
          percent: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // 소분류별
      expenseCategoryData = Object.entries(expenseBySubCategory)
        .map(([name, data]) => ({
          name,
          value: data.value,
          percent: totalExpense > 0 ? Math.round((data.value / totalExpense) * 100) : 0,
          mainCategory: data.mainCategory,
        }))
        .sort((a, b) => b.value - a.value);
    }

    // 수입 대비 지출 퍼센트
    const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

    return {
      transactions: monthlyTransactions,
      totalIncome,
      totalExpense,
      totalOther,
      balance: totalIncome - totalExpense - totalOther,
      barData,
      expenseCategoryData,
      expenseRatio,
      byType,
    };
  };

  // 카테고리별 리포트 데이터
  const getCategoryReportData = () => {
    if (!selectedCategory) {
      return null;
    }

    // 월 선택 모드 또는 날짜 범위 모드에 따라 필터링
    if (categoryDateMode === 'month') {
      const categoryTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.category === selectedCategory &&
          transactionDate.getFullYear() === categoryYear &&
          transactionDate.getMonth() + 1 === categoryMonth
        );
      });

      const totalAmount = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      return {
        totalAmount,
        top3Months: [],
        transactionCount: categoryTransactions.length,
        isMonthMode: true,
      };
    }

    // 날짜 범위 모드
    if (!startDate || !endDate) {
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
      isMonthMode: false,
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

  // 유형 표시 이름 가져오기
  const getTypeDisplayName = (typeName: string) => {
    const type = types.find(t => t.name === typeName);
    return type ? type.display_name : typeName;
  };

  // 엑셀 다운로드 함수
  const exportToExcel = async () => {
    const monthlyTransactions = monthlyData.transactions;
    
    if (monthlyTransactions.length === 0) {
      alert('다운로드할 거래 내역이 없습니다.');
      return;
    }

    try {
      const fileName = `${selectedYear}년_${selectedMonth}월_거래내역.xlsx`;
      
      // 유형 표시 이름 변환
      const dataWithDisplayNames = monthlyTransactions.map((t) => ({
        ...t,
        type: getTypeDisplayName(t.type),
      }));

      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: dataWithDisplayNames,
          fileName,
        }),
      });

      if (!response.ok) {
        throw new Error('엑셀 생성 실패');
      }

      // Blob으로 변환 후 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

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
                <h2 className="text-2xl font-bold mb-6 text-black">월간 리포트</h2>
          
          <div className="flex gap-4 items-center mb-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-black">년도</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded-md text-black bg-white"
              >
                {years.map((year) => (
                  <option key={year} value={year} className="text-black">
                    {year}년
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">월</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded-md text-black bg-white"
              >
                {months.map((month) => (
                  <option key={month} value={month} className="text-black">
                    {month}월
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1"></div>
            <div>
              <button
                onClick={exportToExcel}
                disabled={monthlyData.transactions.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-black"
              >
                엑셀 다운로드
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center py-8 text-black">로딩 중...</p>
          ) : (
            <>
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {monthlyData.totalIncome > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">총 수입</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(monthlyData.totalIncome)}
                    </p>
                  </div>
                )}
                {monthlyData.totalExpense > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">총 지출</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatAmount(monthlyData.totalExpense)}
                    </p>
                    {monthlyData.totalIncome > 0 && (
                      <p className="text-sm mt-1 text-gray-600">
                        수입 대비 {monthlyData.expenseRatio}%
                      </p>
                    )}
                  </div>
                )}
                <div
                  className={`p-4 rounded-lg ${
                    monthlyData.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                  }`}
                >
                  <p className="text-sm mb-1 text-black">잔액</p>
                  <p
                    className={`text-2xl font-bold ${
                      monthlyData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    {formatAmount(monthlyData.balance)}
                  </p>
                </div>
                {monthlyData.totalIncome > 0 && monthlyData.totalExpense > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">지출 비율</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {monthlyData.expenseRatio}%
                    </p>
                    <p className="text-xs mt-1 text-gray-600">
                      수입 대비 지출
                    </p>
                  </div>
                )}
              </div>

              {/* 세로 막대 그래프 */}
              {monthlyData.barData.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-black">유형별 분포</h3>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={monthlyData.barData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fill: '#000' }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatAmount(value).replace('₩', '')}
                          tick={{ fill: '#000' }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatAmount(value)}
                          labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="금액"
                          radius={[4, 4, 0, 0]}
                        >
                          {monthlyData.barData.map((entry, index) => {
                            const typeInfo = types.find(t => t.name === entry.type);
                            const color = typeInfo?.color || COLORS[index % COLORS.length];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={color}
                              />
                            );
                          })}
                          <LabelList 
                            dataKey="value" 
                            position="top" 
                            formatter={(value: number) => formatAmount(value)}
                            style={{ fill: '#000', fontWeight: 'bold', fontSize: '12px' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-black">
                  {selectedYear}년 {selectedMonth}월에 거래 내역이 없습니다.
                </p>
              )}

              {/* 지출 카테고리별 리포트 */}
              {monthlyData.expenseCategoryData.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-black">지출 카테고리별 리포트</h3>
                    <div className="flex gap-2">
                      <select
                        value={expenseMainCategory}
                        onChange={(e) => setExpenseMainCategory(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                      >
                        <option value="">전체 대분류</option>
                        {[...new Set(categories.filter(c => c.type === 'expense').map(c => c.main_category))].sort().map((mainCat) => (
                          <option key={mainCat} value={mainCat}>
                            {mainCat}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpenseViewMode('main')}
                          className={`px-3 py-2 text-sm ${
                            expenseViewMode === 'main'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          대분류
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseViewMode('sub')}
                          className={`px-3 py-2 text-sm ${
                            expenseViewMode === 'sub'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          소분류
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mb-4">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={monthlyData.expenseCategoryData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => formatAmount(value).replace('₩', '')}
                          tick={{ fill: '#000' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={90}
                          tick={{ fill: '#000' }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatAmount(value)}
                          labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="금액"
                          radius={[0, 4, 4, 0]}
                          fill="#EF4444"
                        >
                          {monthlyData.expenseCategoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                          <LabelList 
                            dataKey="percent" 
                            position="right" 
                            formatter={(value: number) => `${value}%`}
                            style={{ fill: '#000', fontWeight: 'bold' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* 지출 카테고리별 상세 테이블 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold mb-3 text-black">지출 카테고리별 상세</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            {expenseViewMode === 'sub' && (
                              <th className="text-left p-2 text-black">대분류</th>
                            )}
                            <th className="text-left p-2 text-black">{expenseViewMode === 'main' ? '대분류' : '소분류'}</th>
                            <th className="text-right p-2 text-black">금액</th>
                            <th className="text-right p-2 text-black">비율</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.expenseCategoryData.map((item, index) => (
                            <tr key={item.name} className="border-b hover:bg-gray-100">
                              {expenseViewMode === 'sub' && item.mainCategory && (
                                <td className="p-2 text-black text-gray-600">{item.mainCategory}</td>
                              )}
                              <td className="p-2 text-black">{item.name}</td>
                              <td className="p-2 text-right font-semibold text-red-600">
                                {formatAmount(item.value)}
                              </td>
                              <td className="p-2 text-right text-gray-600">
                                {item.percent}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* 카테고리 리포트 */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-black">카테고리 리포트</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">카테고리 선택</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="" className="text-gray-500">카테고리를 선택하세요</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat} className="text-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 기간 선택 모드 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">기간 선택 방식</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryDateMode('month')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    categoryDateMode === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  월 선택
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryDateMode('range')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    categoryDateMode === 'range'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  기간 선택
                </button>
              </div>
            </div>

            {categoryDateMode === 'month' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">년도</label>
                  <select
                    value={categoryYear}
                    onChange={(e) => setCategoryYear(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    {years.map((year) => (
                      <option key={year} value={year} className="text-gray-900">
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">월</label>
                  <select
                    value={categoryMonth}
                    onChange={(e) => setCategoryMonth(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    {months.map((month) => (
                      <option key={month} value={month} className="text-gray-900">
                        {month}월
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">시작 날짜</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">종료 날짜</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {categoryReportData ? (
            <div className="space-y-6">
              {/* 총합 */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-black">
                  {categoryReportData.isMonthMode 
                    ? `${categoryYear}년 ${categoryMonth}월 총합` 
                    : '기간별 총합'}
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatAmount(categoryReportData.totalAmount)}
                </p>
                <p className="text-sm mt-2 text-black">
                  거래 건수: {categoryReportData.transactionCount}건
                </p>
              </div>

              {/* TOP 3 달 (기간 선택 모드일 때만 표시) */}
              {!categoryReportData.isMonthMode && categoryReportData.top3Months.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-black">TOP 3 많이 사용한 달</h3>
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
                          <span className="font-medium text-black">{item.displayMonth}</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryReportData.transactionCount === 0 && (
                <p className="text-center py-8 text-black">
                  선택한 기간에 해당 카테고리의 거래 내역이 없습니다.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-black">
              {categoryDateMode === 'month' 
                ? '카테고리를 선택해주세요.'
                : '카테고리와 기간을 선택해주세요.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
