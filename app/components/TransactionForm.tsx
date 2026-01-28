'use client';

import { useState, useEffect } from 'react';
import { TransactionType, TransactionFormData } from '@/types/transaction';
import { addTransaction, getCategories } from '@/lib/db-client';
import { Category } from '@/types/category';

export default function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const getCategoriesByType = (type: TransactionType) => {
    return categories.filter((cat) => cat.type === type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addTransaction(formData);
      setFormData({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      onSuccess();
    } catch (error) {
      console.error('거래 추가 실패:', error);
      alert('거래 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = getCategoriesByType(formData.type);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">거래 추가</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">유형</label>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as TransactionType;
              setFormData({ ...formData, type: newType, category: '' });
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="expense">지출</option>
            <option value="income">수입</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">금액</label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border border-gray-300 rounded-md"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">선택하세요</option>
            {currentCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">날짜</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">설명 (선택사항)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="거래에 대한 설명을 입력하세요"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '추가 중...' : '추가하기'}
      </button>
    </form>
  );
}
