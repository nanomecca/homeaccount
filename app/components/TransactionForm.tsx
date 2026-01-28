'use client';

import { useState, useEffect } from 'react';
import { TransactionFormData } from '@/types/transaction';
import { addTransaction, getCategories, getTransactionTypes } from '@/lib/db-client';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';

export default function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: '',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, typesData] = await Promise.all([
        getCategories(),
        getTransactionTypes(),
      ]);
      setCategories(categoriesData);
      setTypes(typesData);
      if (typesData.length > 0 && !formData.type) {
        setFormData({ ...formData, type: typesData[0].name });
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const getCategoriesByType = (type: string) => {
    return categories.filter((cat) => cat.type === type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addTransaction(formData);
      setFormData({
        type: types.length > 0 ? types[0].name : '',
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
      <h2 className="text-xl font-bold mb-4 text-black">거래 추가</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium mb-2 text-gray-700">금액</label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            min="0"
            step="0.01"
            placeholder="0"
            required
          />
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
          <label className="block text-sm font-medium mb-2 text-gray-700">날짜</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            required
          />
        </div>

        <div className="md:col-span-2">
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
