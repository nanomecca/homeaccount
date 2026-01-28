'use client';

import { useState, useEffect } from 'react';
import { TransactionFormData } from '@/types/transaction';
import { addTransaction, getCategories, getTransactionTypes } from '@/lib/db-client';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction-type';
import { formatAmountInput, parseAmountInput, extractNumbers } from '@/lib/format-amount';

export default function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: '',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
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
        // '지출'을 기본값으로 설정, 없으면 첫 번째 유형 사용
        const defaultType = typesData.find(t => t.name === '지출') || typesData[0];
        setFormData({ ...formData, type: defaultType.name });
      }
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
      // 선택된 소분류의 대분류 찾기
      const selectedCategory = categories.find(
        c => c.type === formData.type && c.name === formData.category
      );
      const mainCategory = selectedCategory?.main_category || selectedMainCategory;

      await addTransaction({
        ...formData,
        main_category: mainCategory,
      });
      // '지출'을 기본값으로 설정, 없으면 첫 번째 유형 사용
      const defaultType = types.find(t => t.name === '지출') || (types.length > 0 ? types[0] : null);
      setFormData({
        type: defaultType ? defaultType.name : '',
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedMainCategory('');
      onSuccess();
    } catch (error) {
      console.error('거래 추가 실패:', error);
      alert('거래 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainCategories = getMainCategories(formData.type);
  const subCategories = getSubCategories(formData.type, selectedMainCategory);

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
              setSelectedMainCategory('');
            }}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            required
          >
            <option value="" className="text-gray-500">선택하세요</option>
            {types.map((type) => (
              <option key={type.id} value={type.name} className="text-gray-900">
                {type.name}
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
