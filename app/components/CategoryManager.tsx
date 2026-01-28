'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryFormData } from '@/types/category';
import { getCategories, addCategory, deleteCategory } from '@/lib/db';
import { TransactionType } from '@/types/transaction';

export default function CategoryManager({ onCategoryChange }: { onCategoryChange: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsAdding(true);
    try {
      await addCategory({
        type: selectedType,
        name: newCategoryName.trim(),
      });
      setNewCategoryName('');
      await loadCategories();
      onCategoryChange();
    } catch (error: any) {
      console.error('카테고리 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 카테고리입니다.');
      } else {
        alert('카테고리 추가에 실패했습니다.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCategory(id);
      await loadCategories();
      onCategoryChange();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const filteredCategories = categories.filter((cat) => cat.type === selectedType);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">카테고리 관리</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">유형 선택</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as TransactionType)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>
      </div>

      <form onSubmit={handleAddCategory} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 카테고리 이름"
            className="flex-1 p-2 border border-gray-300 rounded-md"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isAdding ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-sm font-medium mb-2">
          {selectedType === 'income' ? '수입' : '지출'} 카테고리 목록
        </h3>
        {filteredCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">카테고리가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
