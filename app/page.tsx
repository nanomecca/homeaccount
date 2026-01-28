'use client';

import { useState, useEffect } from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import DateFilter from './components/DateFilter';
import { getTransactions, getTransactionsByDateRange } from '@/lib/db';
import { Transaction } from '@/types/transaction';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  }, [startDate, endDate]);

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">가계부</h1>
        
        <TransactionForm onSuccess={loadTransactions} />
        
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
      </div>
    </main>
  );
}
