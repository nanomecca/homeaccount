'use client';

import { useState, useEffect } from 'react';
import TransactionForm from './components/TransactionForm';
import BulkTransactionForm from './components/BulkTransactionForm';
import TypeCategoryManager from './components/TypeCategoryManager';
import TransactionList from './components/TransactionList';
import DateFilter from './components/DateFilter';
import Report from './components/Report';
import { getTransactions, getTransactionsByDateRange } from '@/lib/db-client';
import { Transaction } from '@/types/transaction';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'manage' | 'report'>('single');

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      let data;
      if (startDate && endDate) {
        data = await getTransactionsByDateRange(startDate, endDate);
      } else {
        data = await getTransactions();
      }
      setTransactions(data);
    } catch (error) {
      console.error('거래 내역 로드 실패:', error);
      alert('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleCategoryChange = () => {
    // 카테고리가 변경되면 폼을 다시 렌더링하기 위해 상태 업데이트
    loadTransactions();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">가계부</h1>
        
        {/* 탭 메뉴 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('single')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'single'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              단일 입력
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`hidden md:block py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'bulk'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              일괄 입력
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              관리
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'report'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              리포트
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'single' && (
          <TransactionForm onSuccess={loadTransactions} />
        )}
        {activeTab === 'bulk' && (
          <div className="hidden md:block">
            <BulkTransactionForm onSuccess={loadTransactions} />
          </div>
        )}
        {activeTab === 'manage' && (
          <TypeCategoryManager onChange={handleCategoryChange} />
        )}
        {activeTab === 'report' && (
          <Report />
        )}
        
        {activeTab !== 'report' && activeTab !== 'manage' && (
          <>
            <DateFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <TransactionList transactions={transactions} onDelete={loadTransactions} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
