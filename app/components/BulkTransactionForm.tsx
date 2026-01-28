'use client';

import { useState, useEffect } from 'react';
import { TransactionFormData } from '@/types/transaction';
import { addTransactions, getCategories, getTransactionTypes } from '@/lib/db-client';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';

interface BulkRow {
  id: string;
  type: string;
  amount: string;
  category: string;
  description: string;
  date: string;
}

export default function BulkTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (types.length > 0 && rows.length === 0) {
      setRows([
        {
          id: '1',
          type: types[0].name,
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        },
      ]);
    }
  }, [types, rows.length]);

  const loadData = async () => {
    try {
      const [categoriesData, typesData] = await Promise.all([
        getCategories(),
        getTransactionTypes(),
      ]);
      setCategories(categoriesData);
      setTypes(typesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        type: types.length > 0 ? types[0].name : '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof BulkRow, value: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validRows = rows.filter(
        (row) =>
          row.amount &&
          parseFloat(row.amount) > 0 &&
          row.category &&
          row.date &&
          row.type
      );

      if (validRows.length === 0) {
        alert('최소 하나의 유효한 거래를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      const transactions: TransactionFormData[] = validRows.map((row) => ({
        type: row.type,
        amount: parseFloat(row.amount),
        category: row.category,
        description: row.description || undefined,
        date: row.date,
      }));

      await addTransactions(transactions);
      setRows([
        {
          id: '1',
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      onSuccess();
    } catch (error) {
      console.error('거래 일괄 추가 실패:', error);
      alert('거래 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoriesByType = (type: string) => {
    return categories.filter((cat) => cat.type === type);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-black">일괄 입력 (엑셀 형태)</h2>
        <button
          type="button"
          onClick={addRow}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          + 행 추가
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-sm font-medium text-black">유형</th>
              <th className="border p-2 text-left text-sm font-medium text-black">카테고리</th>
              <th className="border p-2 text-left text-sm font-medium text-black">금액</th>
              <th className="border p-2 text-left text-sm font-medium text-black">설명</th>
              <th className="border p-2 text-left text-sm font-medium text-black">날짜</th>
              <th className="border p-2 text-center text-sm font-medium w-16 text-black">삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const availableCategories = getCategoriesByType(row.type);
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <select
                      value={row.type}
                      onChange={(e) => {
                        updateRow(row.id, 'type', e.target.value);
                        updateRow(row.id, 'category', '');
                      }}
                      className="w-full p-1 text-sm border border-gray-300 rounded text-gray-900 bg-white"
                      required
                    >
                      <option value="" className="text-gray-500">선택</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.name} className="text-gray-900">
                          {type.display_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-1">
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                      className="w-full p-1 text-sm border border-gray-300 rounded text-gray-900 bg-white"
                      required
                    >
                      <option value="" className="text-gray-500">선택</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.name} className="text-gray-900">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-1">
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      className="w-full p-1 text-sm border border-gray-300 rounded text-gray-900 bg-white placeholder:text-gray-400"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      required
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      className="w-full p-1 text-sm border border-gray-300 rounded text-gray-900 bg-white placeholder:text-gray-400"
                      placeholder="설명 (선택)"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                      className="w-full p-1 text-sm border border-gray-300 rounded text-gray-900 bg-white"
                      required
                    />
                  </td>
                  <td className="border p-1 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800 text-lg"
                        title="행 삭제"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '저장 중...' : `${rows.length}개 거래 일괄 저장`}
      </button>
    </form>
  );
}
