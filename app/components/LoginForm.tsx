'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitPassword = async () => {
    setIsInitializing(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/init', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setMessage('비밀번호가 초기화되었습니다. nano / password 로 로그인하세요.');
      } else {
        setError(data.message || '초기화에 실패했습니다.');
      }
    } catch (err) {
      setError('초기화 중 오류가 발생했습니다.');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">가계부 로그인</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {message && (
            <p className="text-green-600 text-sm">{message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2 text-center">
            처음 사용하시거나 로그인이 안 되나요?
          </p>
          <button
            type="button"
            onClick={handleInitPassword}
            disabled={isInitializing}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isInitializing ? '초기화 중...' : '비밀번호 초기화 (nano/password)'}
          </button>
        </div>
      </div>
    </div>
  );
}
