'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';
import { getCategories, updateTransaction, getTransactionTypes } from '@/lib/db-client';

interface TransactionEditModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionEditModal({ transaction, onClose, onSuccess }: TransactionEditModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: transaction.type,
    amount: Number(transaction.amount),
    category: transaction.category,
    description: transaction.description || '',
    date: transaction.date,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateTransaction(transaction.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('거래 수정 실패:', error);
      alert('거래 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = categories.filter((cat) => cat.type === formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-black">거래 수정</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">유형</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value, category: '' });
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-500">선택하세요</option>
                {types.map((type) => (
                  <option key={type.id} value={type.name} className="text-gray-900">
                    {type.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">카테고리</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-500">선택하세요</option>
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="text-gray-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">금액</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">설명 (선택사항)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="거래에 대한 설명을 입력하세요"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
