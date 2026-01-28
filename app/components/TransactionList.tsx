'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { deleteTransaction, getTransactionTypes, getCategories } from '@/lib/db-client';
import { TransactionType } from '@/types/transaction-type';
import { Category } from '@/types/category';
import TransactionEditModal from './TransactionEditModal';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: () => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 필터 상태
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterMainCategory, setFilterMainCategory] = useState<string>('');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

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

  const getTypeDisplay = (typeName: string) => {
    const type = types.find(t => t.name === typeName);
    return type ? type.display_name : typeName;
  };

  const getTypeColor = (typeName: string) => {
    const type = types.find(t => t.name === typeName);
    return type?.color || '#6B7280';
  };

  // 카테고리 이름으로 대분류 찾기
  const getMainCategory = (typeName: string, categoryName: string) => {
    const category = categories.find(
      c => c.type === typeName && c.name === categoryName
    );
    return category?.main_category || '';
  };

  // 현재 선택된 유형의 대분류 목록
  const getMainCategories = () => {
    const type = filterType || null;
    const filtered = type 
      ? categories.filter(c => c.type === type)
      : categories;
    const mainCats = [...new Set(filtered.map(c => c.main_category))];
    return mainCats.sort();
  };

  // 선택된 대분류의 소분류 목록
  const getSubCategories = () => {
    if (!filterMainCategory) return [];
    const type = filterType || null;
    const filtered = type
      ? categories.filter(c => c.type === type && c.main_category === filterMainCategory)
      : categories.filter(c => c.main_category === filterMainCategory);
    return filtered.map(c => c.name).sort();
  };

  // 필터링된 거래 내역
  const filteredTransactions = transactions.filter(t => {
    // 유형 필터
    if (filterType && t.type !== filterType) return false;
    
    // 대분류 필터
    if (filterMainCategory) {
      const mainCat = getMainCategory(t.type, t.category);
      if (mainCat !== filterMainCategory) return false;
    }
    
    // 소분류 필터
    if (filterSubCategory && t.category !== filterSubCategory) return false;
    
    // 시작 날짜 필터
    if (filterStartDate && t.date < filterStartDate) return false;
    
    // 종료 날짜 필터
    if (filterEndDate && t.date > filterEndDate) return false;
    
    return true;
  });

  // 필터 초기화
  const resetFilters = () => {
    setFilterType('');
    setFilterMainCategory('');
    setFilterSubCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteTransaction(id);
      onDelete();
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      alert('거래 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    onDelete();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-black">거래 내역</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          {showFilters ? '필터 숨기기' : '필터 보기'}
        </button>
      </div>
      
      {/* 필터 섹션 */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-black">필터</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              필터 초기화
            </button>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 유형 필터 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">유형</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterMainCategory('');
                setFilterSubCategory('');
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
            >
              <option value="">전체</option>
              {types.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.display_name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 대분류 필터 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">대분류</label>
            <select
              value={filterMainCategory}
              onChange={(e) => {
                setFilterMainCategory(e.target.value);
                setFilterSubCategory('');
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
            >
              <option value="">전체</option>
              {getMainCategories().map((mainCat) => (
                <option key={mainCat} value={mainCat}>
                  {mainCat}
                </option>
              ))}
            </select>
          </div>

          {/* 소분류 필터 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">소분류</label>
            <select
              value={filterSubCategory}
              onChange={(e) => setFilterSubCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
              disabled={!filterMainCategory}
            >
              <option value="">전체</option>
              {getSubCategories().map((subCat) => (
                <option key={subCat} value={subCat}>
                  {subCat}
                </option>
              ))}
            </select>
          </div>
          
          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">시작일</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
            />
          </div>
          
          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">종료일</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white text-sm"
            />
          </div>
        </div>
        
          {/* 필터 적용 결과 표시 */}
          <p className="mt-3 text-sm text-gray-600">
            총 {filteredTransactions.length}건의 거래가 표시됩니다.
          </p>
        </div>
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm mb-1 text-black">총 수입</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm mb-1 text-black">총 지출</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense)}</p>
        </div>
        <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className="text-sm mb-1 text-black">잔액</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatAmount(balance)}
          </p>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <p className="text-center py-8 text-black">
          {transactions.length === 0 ? '거래 내역이 없습니다.' : '필터 조건에 맞는 거래가 없습니다.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-black">날짜</th>
                <th className="text-left p-2 text-black">유형</th>
                <th className="text-left p-2 text-black">카테고리</th>
                <th className="text-left p-2 text-black">설명</th>
                <th className="text-right p-2 text-black">금액</th>
                <th className="text-center p-2 text-black">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const mainCategory = getMainCategory(transaction.type, transaction.category);
                return (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-black">{formatDate(transaction.date)}</td>
                    <td className="p-2">
                      <span
                        className="px-2 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: getTypeColor(transaction.type) }}
                      >
                        {getTypeDisplay(transaction.type)}
                      </span>
                    </td>
                    <td className="p-2 text-black">
                      {mainCategory && mainCategory !== transaction.category ? (
                        <span>
                          <span className="text-gray-500">{mainCategory}</span>
                          <span className="text-gray-400 mx-1">&gt;</span>
                          <span>{transaction.category}</span>
                        </span>
                      ) : (
                        transaction.category
                      )}
                    </td>
                    <td className="p-2 text-black">{transaction.description || '-'}</td>
                    <td
                      className={`p-2 text-right font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(Number(transaction.amount))}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
