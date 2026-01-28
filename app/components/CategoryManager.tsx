'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryFormData, DEFAULT_MAIN_CATEGORIES } from '@/types/category';
import { getCategories, addCategory, deleteCategory, getTransactionTypes } from '@/lib/db-client';
import { TransactionType } from '@/types/transaction-type';

export default function CategoryManager({ onCategoryChange }: { onCategoryChange: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newMainCategoryName, setNewMainCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddMainCategory, setShowAddMainCategory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (types.length > 0 && !selectedType) {
      setSelectedType(types[0].name);
    }
  }, [types, selectedType]);

  useEffect(() => {
    // 유형이 변경되면 대분류 선택 초기화
    setSelectedMainCategory('');
  }, [selectedType]);

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
  const getMainCategories = () => {
    const existingMainCategories = [...new Set(
      categories
        .filter(cat => cat.type === selectedType)
        .map(cat => cat.main_category)
    )];
    return existingMainCategories.sort();
  };

  // 선택된 대분류의 소분류 목록 가져오기
  const getSubCategories = () => {
    return categories.filter(
      cat => cat.type === selectedType && cat.main_category === selectedMainCategory
    );
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainCategoryName.trim()) return;

    setIsAdding(true);
    try {
      // 대분류 추가 (소분류는 대분류와 같은 이름으로 기본 생성)
      await addCategory({
        type: selectedType,
        main_category: newMainCategoryName.trim(),
        name: newMainCategoryName.trim(),
      });
      setNewMainCategoryName('');
      setShowAddMainCategory(false);
      await loadData();
      onCategoryChange();
    } catch (error: any) {
      console.error('대분류 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 대분류입니다.');
      } else {
        alert('대분류 추가에 실패했습니다.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategoryName.trim() || !selectedMainCategory) return;

    setIsAdding(true);
    try {
      await addCategory({
        type: selectedType,
        main_category: selectedMainCategory,
        name: newSubCategoryName.trim(),
      });
      setNewSubCategoryName('');
      await loadData();
      onCategoryChange();
    } catch (error: any) {
      console.error('소분류 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 소분류입니다.');
      } else {
        alert('소분류 추가에 실패했습니다.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCategory(id);
      await loadData();
      onCategoryChange();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const mainCategories = getMainCategories();
  const subCategories = getSubCategories();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 text-black">카테고리 관리</h2>
      
      {/* 유형 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">유형 선택</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
        >
          <option value="" className="text-gray-500">선택하세요</option>
          {types.map((type) => (
            <option key={type.id} value={type.name} className="text-gray-900">
              {type.display_name}
            </option>
          ))}
        </select>
      </div>

      {selectedType && (
        <>
          {/* 대분류 섹션 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold text-black">대분류</h3>
              <button
                type="button"
                onClick={() => setShowAddMainCategory(!showAddMainCategory)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAddMainCategory ? '취소' : '+ 대분류 추가'}
              </button>
            </div>

            {showAddMainCategory && (
              <form onSubmit={handleAddMainCategory} className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMainCategoryName}
                    onChange={(e) => setNewMainCategoryName(e.target.value)}
                    placeholder="새 대분류 이름"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {mainCategories.map((mainCat) => (
                <button
                  key={mainCat}
                  type="button"
                  onClick={() => setSelectedMainCategory(mainCat)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedMainCategory === mainCat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {mainCat}
                </button>
              ))}
              {mainCategories.length === 0 && (
                <p className="text-gray-500 text-sm">대분류가 없습니다. 대분류를 먼저 추가해주세요.</p>
              )}
            </div>
          </div>

          {/* 소분류 섹션 */}
          {selectedMainCategory && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-md font-semibold mb-3 text-black">
                소분류 ({selectedMainCategory})
              </h3>

              <form onSubmit={handleAddSubCategory} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    placeholder="새 소분류 이름"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
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

              {subCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">소분류가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200"
                    >
                      <span className="text-sm text-black">{category.name}</span>
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
          )}
        </>
      )}
    </div>
  );
}
