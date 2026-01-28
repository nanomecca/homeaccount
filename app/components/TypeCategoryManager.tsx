'use client';

import { useState, useEffect } from 'react';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { Category, CategoryFormData } from '@/types/category';
import {
  getTransactionTypes,
  addTransactionType,
  updateTransactionType,
  deleteTransactionType,
  getCategories,
  addCategory,
  deleteCategory,
} from '@/lib/db-client';

export default function TypeCategoryManager({ onChange }: { onChange: () => void }) {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 유형 관리 상태
  const [editingType, setEditingType] = useState<TransactionType | null>(null);
  const [typeFormData, setTypeFormData] = useState<TransactionTypeFormData>({
    name: '',
    display_name: '',
    color: '#3B82F6',
  });
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  
  // 카테고리 관리 상태
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (types.length > 0 && !selectedType) {
      setSelectedType(types[0].name);
    }
  }, [types, selectedType]);

  const loadData = async () => {
    try {
      const [typesData, categoriesData] = await Promise.all([
        getTransactionTypes(),
        getCategories(),
      ]);
      setTypes(typesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  // 유형 관리 함수들
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeFormData.name.trim() || !typeFormData.display_name.trim()) return;

    setIsSubmittingType(true);
    try {
      if (editingType) {
        await updateTransactionType(editingType.id, typeFormData);
      } else {
        await addTransactionType(typeFormData);
      }
      setTypeFormData({ name: '', display_name: '', color: '#3B82F6' });
      setEditingType(null);
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('유형 저장 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 유형입니다.');
      } else {
        alert('유형 저장에 실패했습니다.');
      }
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleTypeEdit = (type: TransactionType) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      display_name: type.display_name,
      color: type.color || '#3B82F6',
    });
  };

  const handleTypeCancel = () => {
    setEditingType(null);
    setTypeFormData({ name: '', display_name: '', color: '#3B82F6' });
  };

  const handleTypeDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 유형을 사용하는 거래가 있다면 삭제할 수 없습니다.')) return;

    try {
      await deleteTransactionType(id);
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('유형 삭제 실패:', error);
      if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        alert('이 유형을 사용하는 거래가 있어 삭제할 수 없습니다.');
      } else {
        alert('유형 삭제에 실패했습니다.');
      }
    }
  };

  // 카테고리 관리 함수들
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !selectedType) return;

    setIsAddingCategory(true);
    try {
      await addCategory({
        type: selectedType,
        name: newCategoryName.trim(),
      });
      setNewCategoryName('');
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('카테고리 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 카테고리입니다.');
      } else {
        alert('카테고리 추가에 실패했습니다.');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCategory(id);
      await loadData();
      onChange();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const filteredCategories = categories.filter((cat) => cat.type === selectedType);

  return (
    <div className="space-y-6">
      {/* 유형 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-black">유형 관리</h2>
        
        <form onSubmit={handleTypeSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">유형 코드 (영문)</label>
              <input
                type="text"
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white placeholder:text-gray-400"
                placeholder="예: expense"
                required
                disabled={!!editingType}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">표시 이름</label>
              <input
                type="text"
                value={typeFormData.display_name}
                onChange={(e) => setTypeFormData({ ...typeFormData, display_name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white placeholder:text-gray-400"
                placeholder="예: 지출"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">색상</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={typeFormData.color}
                  onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={typeFormData.color}
                  onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-black bg-white placeholder:text-gray-400"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={isSubmittingType}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmittingType ? '저장 중...' : editingType ? '수정하기' : '추가하기'}
            </button>
            {editingType && (
              <button
                type="button"
                onClick={handleTypeCancel}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            )}
          </div>
        </form>

        <div>
          <h3 className="text-sm font-medium mb-2 text-black">유형 목록</h3>
          {types.length === 0 ? (
            <p className="text-gray-500 text-sm">유형이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {types.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: type.color || '#3B82F6' }}
                    />
                    <div>
                      <span className="font-medium text-black">{type.display_name}</span>
                      <span className="text-sm text-gray-500 ml-2">({type.name})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTypeEdit(type)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleTypeDelete(type.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-black">카테고리 관리</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-black">유형 선택</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
          >
            <option value="" className="text-gray-500">선택하세요</option>
            {types.map((type) => (
              <option key={type.id} value={type.name} className="text-black">
                {type.display_name}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleCategorySubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="새 카테고리 이름"
              className="flex-1 p-2 border border-gray-300 rounded-md text-black bg-white placeholder:text-gray-400"
              required
            />
            <button
              type="submit"
              disabled={isAddingCategory}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isAddingCategory ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-sm font-medium mb-2 text-black">
            {types.find(t => t.name === selectedType)?.display_name || '유형'} 카테고리 목록
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
                  <span className="text-sm text-black">{category.name}</span>
                  <button
                    onClick={() => handleCategoryDelete(category.id)}
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
    </div>
  );
}
