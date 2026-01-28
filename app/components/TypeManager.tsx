'use client';

import { useState, useEffect } from 'react';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { getTransactionTypes, addTransactionType, updateTransactionType, deleteTransactionType } from '@/lib/db-client';

export default function TypeManager({ onTypeChange }: { onTypeChange: () => void }) {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [editingType, setEditingType] = useState<TransactionType | null>(null);
  const [formData, setFormData] = useState<TransactionTypeFormData>({
    name: '',
    display_name: '',
    color: '#3B82F6',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await getTransactionTypes();
      setTypes(data);
    } catch (error) {
      console.error('유형 로드 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.display_name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingType) {
        await updateTransactionType(editingType.id, formData);
      } else {
        await addTransactionType(formData);
      }
      setFormData({ name: '', display_name: '', color: '#3B82F6' });
      setEditingType(null);
      await loadTypes();
      onTypeChange();
    } catch (error: any) {
      console.error('유형 저장 실패:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        alert('이미 존재하는 유형입니다.');
      } else {
        alert('유형 저장에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (type: TransactionType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      display_name: type.display_name,
      color: type.color || '#3B82F6',
    });
  };

  const handleCancel = () => {
    setEditingType(null);
    setFormData({ name: '', display_name: '', color: '#3B82F6' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 유형을 사용하는 거래가 있다면 삭제할 수 없습니다.')) return;

    try {
      await deleteTransactionType(id);
      await loadTypes();
      onTypeChange();
    } catch (error: any) {
      console.error('유형 삭제 실패:', error);
      if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        alert('이 유형을 사용하는 거래가 있어 삭제할 수 없습니다.');
      } else {
        alert('유형 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">유형 관리</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">유형 코드 (영문)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
              placeholder="예: expense"
              required
              disabled={!!editingType}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">표시 이름</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
              placeholder="예: 지출"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">색상</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 p-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : editingType ? '수정하기' : '추가하기'}
          </button>
          {editingType && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="text-sm font-medium mb-2">유형 목록</h3>
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
                    <span className="font-medium">{type.display_name}</span>
                    <span className="text-sm text-gray-500 ml-2">({type.name})</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
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
  );
}
