'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { deleteTransaction, getTransactionTypes } from '@/lib/db-client';
import { TransactionType } from '@/types/transaction-type';
import TransactionEditModal from './TransactionEditModal';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [types, setTypes] = useState<TransactionType[]>([]);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await getTransactionTypes();
      setTypes(data);
    } catch (error) {
      console.error('유형 로드 실패:', error);
    }
  };

  const getTypeDisplay = (typeName: string) => {
    const type = types.find(t => t.name === typeName);
    return type ? type.display_name : typeName;
  };

  const getTypeColor = (typeName: string) => {
    const type = types.find(t => t.name === typeName);
    return type?.color || '#6B7280';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteTransaction(id);
      onDelete();
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      alert('거래 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    onDelete();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // 엑셀 다운로드 함수
  const exportToExcel = async () => {
    if (transactions.length === 0) {
      alert('다운로드할 거래 내역이 없습니다.');
      return;
    }

    try {
      // 파일명 생성 (날짜 범위 포함)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `거래내역_${dateStr}.xlsx`;

      // 유형 표시 이름 변환
      const dataWithDisplayNames = transactions.map((t) => ({
        ...t,
        type: getTypeDisplay(t.type),
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-black">거래 내역</h2>
        {transactions.length > 0 && (
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            엑셀 다운로드
          </button>
        )}
      </div>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm mb-1 text-black">총 수입</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm mb-1 text-black">총 지출</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense)}</p>
        </div>
        <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className="text-sm mb-1 text-black">잔액</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatAmount(balance)}
          </p>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <p className="text-center py-8 text-black">거래 내역이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-black">날짜</th>
                <th className="text-left p-2 text-black">유형</th>
                <th className="text-left p-2 text-black">카테고리</th>
                <th className="text-left p-2 text-black">설명</th>
                <th className="text-right p-2 text-black">금액</th>
                <th className="text-center p-2 text-black">작업</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-black">{formatDate(transaction.date)}</td>
                  <td className="p-2">
                    <span
                      className="px-2 py-1 rounded text-sm text-white"
                      style={{ backgroundColor: getTypeColor(transaction.type) }}
                    >
                      {getTypeDisplay(transaction.type)}
                    </span>
                  </td>
                  <td className="p-2 text-black">{transaction.category}</td>
                  <td className="p-2 text-black">{transaction.description || '-'}</td>
                  <td
                    className={`p-2 text-right font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatAmount(Number(transaction.amount))}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
