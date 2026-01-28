'use client';

import { Transaction } from '@/types/transaction';
import { deleteTransaction } from '@/lib/db-client';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <h2 className="text-xl font-bold mb-4">거래 내역</h2>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">거래 내역이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">날짜</th>
                <th className="text-left p-2">유형</th>
                <th className="text-left p-2">카테고리</th>
                <th className="text-left p-2">설명</th>
                <th className="text-right p-2">금액</th>
                <th className="text-center p-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{formatDate(transaction.date)}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.type === 'income' ? '수입' : '지출'}
                    </span>
                  </td>
                  <td className="p-2">{transaction.category}</td>
                  <td className="p-2 text-gray-600">{transaction.description || '-'}</td>
                  <td
                    className={`p-2 text-right font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatAmount(Number(transaction.amount))}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
