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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
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

  // 연간 리포트 데이터
  const getAnnualReportData = () => {
    const annualTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === annualYear;
    });

    // 유형별 집계
    const byType = annualTransactions.reduce((acc, t) => {
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

    // 유형별 데이터 (세로 막대 그래프용)
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

    // 월별 집계
    const monthlyData = annualTransactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const monthKey = date.getMonth() + 1;
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expense: 0, other: 0 };
      }
      if (t.type === 'income') {
        acc[monthKey].income += Number(t.amount);
      } else if (t.type === 'expense') {
        acc[monthKey].expense += Number(t.amount);
      } else {
        acc[monthKey].other += Number(t.amount);
      }
      return acc;
    }, {} as Record<number, { income: number; expense: number; other: number }>);

    // 월별 데이터 배열 생성
    const monthlyBarData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = monthlyData[month] || { income: 0, expense: 0, other: 0 };
      return {
        month: `${month}월`,
        수입: data.income,
        지출: data.expense,
        기타: data.other,
      };
    });

    // 카테고리별 집계 (지출)
    const expenseByCategory = annualTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = { value: 0, mainCategory: '' };
        }
        acc[category].value += Number(t.amount);
        const categoryInfo = categories.find(c => c.type === 'expense' && c.name === category);
        if (categoryInfo) {
          acc[category].mainCategory = categoryInfo.main_category;
        }
        return acc;
      }, {} as Record<string, { value: number; mainCategory: string }>);

    const expenseCategoryData = Object.entries(expenseByCategory)
      .map(([name, data]) => ({
        name,
        value: data.value,
        percent: totalExpense > 0 ? Math.round((data.value / totalExpense) * 100) : 0,
        mainCategory: data.mainCategory,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      transactions: annualTransactions,
      totalIncome,
      totalExpense,
      totalOther,
      balance: totalIncome - totalExpense - totalOther,
      barData,
      monthlyBarData,
      expenseCategoryData,
      expenseRatio: totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0,
      byType,
    };
  };

  const monthlyData = getMonthlyData();
  const annualData = reportType === 'annual' ? getAnnualReportData() : null;

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
            onClick={() => setReportType('annual')}
            className={`px-4 py-2 rounded-md font-medium ${
              reportType === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            연간 리포트
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
        /* 연간 리포트 */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-black">연간 리포트</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">년도 선택</label>
            <select
              value={annualYear}
              onChange={(e) => setAnnualYear(parseInt(e.target.value))}
              className="p-2 border border-gray-300 rounded-md text-black bg-white"
            >
              {years.map((year) => (
                <option key={year} value={year} className="text-black">
                  {year}년
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-center py-8 text-black">로딩 중...</p>
          ) : annualData ? (
            <>
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {annualData.totalIncome > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">총 수입</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(annualData.totalIncome)}
                    </p>
                  </div>
                )}
                {annualData.totalExpense > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">총 지출</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatAmount(annualData.totalExpense)}
                    </p>
                    {annualData.totalIncome > 0 && (
                      <p className="text-sm mt-1 text-gray-600">
                        수입 대비 {annualData.expenseRatio}%
                      </p>
                    )}
                  </div>
                )}
                <div
                  className={`p-4 rounded-lg ${
                    annualData.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                  }`}
                >
                  <p className="text-sm mb-1 text-black">잔액</p>
                  <p
                    className={`text-2xl font-bold ${
                      annualData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    {formatAmount(annualData.balance)}
                  </p>
                </div>
                {annualData.totalIncome > 0 && annualData.totalExpense > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm mb-1 text-black">지출 비율</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {annualData.expenseRatio}%
                    </p>
                    <p className="text-xs mt-1 text-gray-600">
                      수입 대비 지출
                    </p>
                  </div>
                )}
              </div>

              {/* 유형별 분포 그래프 */}
              {annualData.barData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-black">유형별 분포</h3>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={annualData.barData}
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
                          {annualData.barData.map((entry, index) => {
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
              )}

              {/* 월별 추이 그래프 */}
              {annualData.monthlyBarData.some(m => m.수입 > 0 || m.지출 > 0) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-black">월별 추이</h3>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={annualData.monthlyBarData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month"
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
                        <Bar dataKey="수입" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="지출" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        {annualData.monthlyBarData.some(m => m.기타 > 0) && (
                          <Bar dataKey="기타" fill="#6B7280" radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 지출 카테고리별 리포트 */}
              {annualData.expenseCategoryData.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-black">지출 카테고리별 리포트</h3>
                    <div className="flex gap-2">
                      <select
                        value={expenseMainCategory}
                        onChange={(e) => setExpenseMainCategory(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
                      >
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
                        data={annualData.expenseCategoryData.filter(item => 
                          !expenseMainCategory || item.mainCategory === expenseMainCategory
                        )}
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
                          {annualData.expenseCategoryData
                            .filter(item => !expenseMainCategory || item.mainCategory === expenseMainCategory)
                            .map((entry, index) => (
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
                          {annualData.expenseCategoryData
                            .filter(item => !expenseMainCategory || item.mainCategory === expenseMainCategory)
                            .map((item, index) => (
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

              {annualData.transactions.length === 0 && (
                <p className="text-center py-8 text-black">
                  {annualYear}년에 거래 내역이 없습니다.
                </p>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-black">
              {annualYear}년에 거래 내역이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
