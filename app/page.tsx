'use client';

import { useState, useEffect } from 'react';
import TransactionForm from './components/TransactionForm';
import BulkTransactionForm from './components/BulkTransactionForm';
import TypeCategoryManager from './components/TypeCategoryManager';
import TransactionList from './components/TransactionList';
import Report from './components/Report';
import LoginForm from './components/LoginForm';
import ChangePasswordModal from './components/ChangePasswordModal';
import { useAuth } from './contexts/AuthContext';
import { getTransactions } from '@/lib/db-client';
import { Transaction } from '@/types/transaction';

export default function Home() {
  const { isAuthenticated, username, logout, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'manage' | 'report'>('single');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [copiedTransaction, setCopiedTransaction] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('거래 내역 로드 실패:', error);
      alert('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleCategoryChange = () => {
    // 카테고리가 변경되면 폼을 다시 렌더링하기 위해 상태 업데이트
    loadTransactions();
  };

  const handleCopyTransaction = (transaction: Transaction) => {
    setCopiedTransaction(transaction);
    // 단일 입력 탭으로 전환
    setActiveTab('single');
  };

  const handleCopiedTransactionUsed = () => {
    setCopiedTransaction(null);
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Home 자산관리 시스템</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">안녕하세요, <strong>{username}</strong>님</span>
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              비밀번호 변경
            </button>
            <button
              onClick={logout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('single')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'single'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              단일 입력
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`hidden md:block py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'bulk'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              일괄 입력
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              메뉴관리
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'report'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              리포트
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'single' && (
          <TransactionForm 
            onSuccess={loadTransactions} 
            copiedTransaction={copiedTransaction}
            onCopiedTransactionUsed={handleCopiedTransactionUsed}
          />
        )}
        {activeTab === 'bulk' && (
          <div className="hidden md:block">
            <BulkTransactionForm onSuccess={loadTransactions} />
          </div>
        )}
        {activeTab === 'manage' && (
          <TypeCategoryManager onChange={handleCategoryChange} />
        )}
        {activeTab === 'report' && (
          <Report />
        )}
        {activeTab !== 'report' && activeTab !== 'manage' && (
          <>
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <TransactionList 
                transactions={transactions} 
                onDelete={loadTransactions}
                onCopy={handleCopyTransaction}
              />
            )}
          </>
        )}
      </div>

      {/* 비밀번호 변경 모달 */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </main>
  );
}
