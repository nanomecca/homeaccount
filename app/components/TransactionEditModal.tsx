'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';
import { getCategories, updateTransaction, getTransactionTypes } from '@/lib/db-client';
import { formatAmountInput, parseAmountInput, extractNumbers } from '@/lib/format-amount';

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
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 카테고리가 로드된 후 기존 거래의 대분류 찾기
    if (categories.length > 0 && !selectedMainCategory) {
      const currentCategory = categories.find(
        cat => cat.type === transaction.type && cat.name === transaction.category
      );
      if (currentCategory) {
        setSelectedMainCategory(currentCategory.main_category);
      }
    }
  }, [categories, transaction.type, transaction.category, selectedMainCategory]);

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

  // 현재 유형의 대분류 목록 가져오기
  const getMainCategories = (type: string) => {
    const mainCats = [...new Set(
      categories
        .filter(cat => cat.type === type)
        .map(cat => cat.main_category)
    )];
    return mainCats.sort();
  };

  // 선택된 대분류의 소분류 목록 가져오기
  const getSubCategories = (type: string, mainCategory: string) => {
    return categories.filter(
      cat => cat.type === type && cat.main_category === mainCategory
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 유효성 검사
      if (!formData.type || !formData.category || !formData.amount || formData.amount <= 0 || !formData.date) {
        alert('모든 필수 항목을 올바르게 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      await updateTransaction(transaction.id, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('거래 수정 실패:', error);
      const errorMessage = error?.message || error?.error || '거래 수정에 실패했습니다.';
      alert(`거래 수정에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainCategories = getMainCategories(formData.type);
  const subCategories = getSubCategories(formData.type, selectedMainCategory);

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
                  setSelectedMainCategory('');
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
              <label className="block text-sm font-medium mb-2 text-gray-700">대분류</label>
              <select
                value={selectedMainCategory}
                onChange={(e) => {
                  setSelectedMainCategory(e.target.value);
                  setFormData({ ...formData, category: '' });
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-500">선택하세요</option>
                {mainCategories.map((mainCat) => (
                  <option key={mainCat} value={mainCat} className="text-gray-900">
                    {mainCat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">소분류</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                required
                disabled={!selectedMainCategory}
              >
                <option value="" className="text-gray-500">
                  {selectedMainCategory ? '선택하세요' : '대분류를 먼저 선택하세요'}
                </option>
                {subCategories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="text-gray-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">금액</label>
              <div className="relative">
                <input
                  type="text"
                  value={formatAmountInput(formData.amount)}
                  onChange={(e) => {
                    const numbers = extractNumbers(e.target.value);
                    const parsed = parseAmountInput(numbers);
                    setFormData({ ...formData, amount: parsed });
                  }}
                  onBlur={(e) => {
                    // 포커스가 벗어날 때 포맷팅 적용
                    const parsed = parseAmountInput(e.target.value);
                    setFormData({ ...formData, amount: parsed });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white pr-8"
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">원</span>
              </div>
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
