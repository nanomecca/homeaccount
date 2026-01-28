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
  updateMainCategory,
  updateSubCategory,
} from '@/lib/db-client';

export default function TypeCategoryManager({ onChange }: { onChange: () => void }) {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 유형 관리 상태
  const [editingType, setEditingType] = useState<TransactionType | null>(null);
  const [typeFormData, setTypeFormData] = useState<TransactionTypeFormData>({
    name: '',
    color: '#3B82F6',
  });
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  
  // 카테고리 관리 상태
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [newMainCategoryName, setNewMainCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showAddMainCategory, setShowAddMainCategory] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<string | null>(null);
  const [editingMainCategoryName, setEditingMainCategoryName] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState('');

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
    if (!typeFormData.name.trim()) return;

    setIsSubmittingType(true);
    try {
      if (editingType) {
        await updateTransactionType(editingType.id, typeFormData);
      } else {
        await addTransactionType(typeFormData);
      }
      setTypeFormData({ name: '', color: '#3B82F6' });
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
      color: type.color || '#3B82F6',
    });
  };

  const handleTypeCancel = () => {
    setEditingType(null);
    setTypeFormData({ name: '', color: '#3B82F6' });
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
  const getMainCategories = () => {
    const mainCats = [...new Set(
      categories
        .filter(cat => cat.type === selectedType)
        .map(cat => cat.main_category)
    )];
    return mainCats.sort();
  };

  const getSubCategories = () => {
    return categories.filter(
      cat => cat.type === selectedType && cat.main_category === selectedMainCategory
    );
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainCategoryName.trim() || !selectedType) return;

    setIsAddingCategory(true);
    try {
      await addCategory({
        type: selectedType,
        main_category: newMainCategoryName.trim(),
        name: newMainCategoryName.trim(),
      });
      setNewMainCategoryName('');
      setShowAddMainCategory(false);
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('대분류 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 대분류입니다.');
      } else {
        alert('대분류 추가에 실패했습니다.');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategoryName.trim() || !selectedMainCategory) return;

    setIsAddingCategory(true);
    try {
      await addCategory({
        type: selectedType,
        main_category: selectedMainCategory,
        name: newSubCategoryName.trim(),
      });
      setNewSubCategoryName('');
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('소분류 추가 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 소분류입니다.');
      } else {
        alert('소분류 추가에 실패했습니다.');
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

  const handleMainCategoryDelete = async (mainCategory: string) => {
    if (!confirm(`"${mainCategory}" 대분류와 모든 소분류를 삭제하시겠습니까?`)) return;

    try {
      // 해당 대분류의 모든 소분류 삭제
      const categoriesToDelete = categories.filter(
        cat => cat.type === selectedType && cat.main_category === mainCategory
      );
      
      for (const category of categoriesToDelete) {
        await deleteCategory(category.id);
      }
      
      await loadData();
      if (selectedMainCategory === mainCategory) {
        setSelectedMainCategory('');
      }
      onChange();
    } catch (error) {
      console.error('대분류 삭제 실패:', error);
      alert('대분류 삭제에 실패했습니다.');
    }
  };

  const handleMainCategoryEdit = (mainCategory: string) => {
    setEditingMainCategory(mainCategory);
    setEditingMainCategoryName(mainCategory);
  };

  const handleMainCategoryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMainCategory || !editingMainCategoryName.trim() || !selectedType) return;
    if (editingMainCategoryName.trim() === editingMainCategory) {
      setEditingMainCategory(null);
      return;
    }

    setIsAddingCategory(true);
    try {
      await updateMainCategory(
        selectedType,
        editingMainCategory,
        editingMainCategoryName.trim()
      );
      setEditingMainCategory(null);
      setEditingMainCategoryName('');
      if (selectedMainCategory === editingMainCategory) {
        setSelectedMainCategory(editingMainCategoryName.trim());
      }
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('대분류 수정 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 대분류입니다.');
      } else {
        alert('대분류 수정에 실패했습니다.');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleMainCategoryEditCancel = () => {
    setEditingMainCategory(null);
    setEditingMainCategoryName('');
  };

  const handleSubCategoryEdit = (category: Category) => {
    setEditingSubCategory(category.id);
    setEditingSubCategoryName(category.name);
  };

  const handleSubCategoryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory || !editingSubCategoryName.trim()) return;

    const category = categories.find(c => c.id === editingSubCategory);
    if (!category) return;
    if (editingSubCategoryName.trim() === category.name) {
      setEditingSubCategory(null);
      return;
    }

    setIsAddingCategory(true);
    try {
      await updateSubCategory(editingSubCategory, editingSubCategoryName.trim());
      setEditingSubCategory(null);
      setEditingSubCategoryName('');
      await loadData();
      onChange();
    } catch (error: any) {
      console.error('소분류 수정 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 소분류입니다.');
      } else {
        alert('소분류 수정에 실패했습니다.');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubCategoryEditCancel = () => {
    setEditingSubCategory(null);
    setEditingSubCategoryName('');
  };

  const mainCategories = getMainCategories();
  const subCategories = getSubCategories();

  return (
    <div className="space-y-6">
      {/* 유형 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-black">유형 관리</h2>
        
        <form onSubmit={handleTypeSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">유형이름</label>
              <input
                type="text"
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
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
                      <span className="font-medium text-black">{type.name}</span>
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
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedMainCategory('');
            }}
            className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
          >
            <option value="" className="text-gray-500">선택하세요</option>
            {types.map((type) => (
              <option key={type.id} value={type.name} className="text-black">
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {selectedType && (
          <>
            {/* 대분류 섹션 */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
                      className="flex-1 p-2 border border-gray-300 rounded-md text-black bg-white placeholder:text-gray-400"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isAddingCategory}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      추가
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap gap-2">
                {mainCategories.map((mainCat) => (
                  <div
                    key={mainCat}
                    className="flex items-center gap-1"
                  >
                    {editingMainCategory === mainCat ? (
                      <form onSubmit={handleMainCategoryUpdate} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingMainCategoryName}
                          onChange={(e) => setEditingMainCategoryName(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-full text-sm text-black bg-white"
                          autoFocus
                          required
                        />
                        <button
                          type="submit"
                          disabled={isAddingCategory}
                          className="text-green-600 hover:text-green-800 text-sm px-1"
                          title="저장"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleMainCategoryEditCancel}
                          className="text-gray-600 hover:text-gray-800 text-sm px-1"
                          title="취소"
                        >
                          ×
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
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
                        <button
                          type="button"
                          onClick={() => handleMainCategoryEdit(mainCat)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-1"
                          title="대분류 수정"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMainCategoryDelete(mainCat)}
                          className="text-red-600 hover:text-red-800 text-sm px-1"
                          title="대분류 삭제"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {mainCategories.length === 0 && (
                  <p className="text-gray-500 text-sm">대분류가 없습니다.</p>
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

                {subCategories.length === 0 ? (
                  <p className="text-gray-500 text-sm">소분류가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200"
                      >
                        {editingSubCategory === category.id ? (
                          <form onSubmit={handleSubCategoryUpdate} className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingSubCategoryName}
                              onChange={(e) => setEditingSubCategoryName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                              autoFocus
                              required
                            />
                            <button
                              type="submit"
                              disabled={isAddingCategory}
                              className="text-green-600 hover:text-green-800 text-xs"
                              title="저장"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={handleSubCategoryEditCancel}
                              className="text-gray-600 hover:text-gray-800 text-xs"
                              title="취소"
                            >
                              ×
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="text-sm text-black">{category.name}</span>
                            <button
                              onClick={() => handleSubCategoryEdit(category)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="소분류 수정"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(category.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="삭제"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
