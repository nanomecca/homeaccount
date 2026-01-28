'use client';

import { useState, useEffect } from 'react';
import { Asset, AssetFormData } from '@/types/asset';
import { formatAmount, formatAmountInput, parseAmountInput, extractNumbers } from '@/lib/format-amount';

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<AssetFormData>({
    type: 'savings',
    bank_name: '',
    amount: 0,
    interest_rate: 0,
    maturity_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) throw new Error('자산 목록 로드 실패');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('자산 로드 실패:', error);
      alert('자산 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAsset) {
        // 수정
        const response = await fetch(`/api/assets/${editingAsset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('자산 수정 실패');
      } else {
        // 추가
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('자산 추가 실패');
      }

      // 폼 초기화
      setFormData({
        type: 'savings',
        bank_name: '',
        amount: 0,
        interest_rate: 0,
        maturity_date: '',
      });
      setEditingAsset(null);
      loadAssets();
    } catch (error) {
      console.error('자산 저장 실패:', error);
      alert('자산 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      type: asset.type,
      bank_name: asset.bank_name,
      amount: Number(asset.amount),
      interest_rate: Number(asset.interest_rate),
      maturity_date: asset.maturity_date,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('자산 삭제 실패');
      loadAssets();
    } catch (error) {
      console.error('자산 삭제 실패:', error);
      alert('자산 삭제에 실패했습니다.');
    }
  };

  const handleMaturity = async (id: string) => {
    if (!confirm('만기 처리하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/assets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'matured' }),
      });
      if (!response.ok) throw new Error('만기 처리 실패');
      loadAssets();
    } catch (error) {
      console.error('만기 처리 실패:', error);
      alert('만기 처리에 실패했습니다.');
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('해제 처리하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/assets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!response.ok) throw new Error('해제 처리 실패');
      loadAssets();
    } catch (error) {
      console.error('해제 처리 실패:', error);
      alert('해제 처리에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingAsset(null);
    setFormData({
      type: 'savings',
      bank_name: '',
      amount: 0,
      interest_rate: 0,
      maturity_date: '',
    });
  };

  // 이자 계산 함수
  const calculateInterest = (asset: Asset) => {
    const status = asset.status || 'active';
    
    // 만기나 해제된 자산은 이자 계산 안 함
    if (status !== 'active') {
      return { beforeTax: 0, afterTax: 0, daysRemaining: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maturityDate = new Date(asset.maturity_date);
    maturityDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const years = daysDiff / 365;

    // 만기일이 지났거나 오늘인 경우 전체 기간 계산 (가입일부터 만기일까지)
    if (daysDiff <= 0) {
      // 만기일까지의 전체 기간 계산 (가입일부터 만기일까지)
      const createdDate = asset.created_at ? new Date(asset.created_at) : today;
      createdDate.setHours(0, 0, 0, 0);
      const totalDays = Math.floor((maturityDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalYears = Math.max(1, totalDays) / 365; // 최소 1일
      
      const principal = Number(asset.amount);
      const rate = Number(asset.interest_rate) / 100;
      const interestBeforeTax = principal * rate * totalYears;
      const taxRate = 0.154; // 15.4%
      const interestAfterTax = interestBeforeTax * (1 - taxRate);

      return {
        beforeTax: interestBeforeTax,
        afterTax: interestAfterTax,
        daysRemaining: 0,
      };
    }

    const principal = Number(asset.amount);
    const rate = Number(asset.interest_rate) / 100;

    // 단리 계산 (적금/예금 모두 단리로 가정)
    const interestBeforeTax = principal * rate * years;
    
    // 세율 계산 (한국 기준)
    // 연간 이자소득 2,000만원 이하: 15.4% (소득세 14% + 지방소득세 1.4%)
    const taxRate = 0.154; // 기본 15.4%
    const interestAfterTax = interestBeforeTax * (1 - taxRate);

    return {
      beforeTax: interestBeforeTax,
      afterTax: interestAfterTax,
      daysRemaining: daysDiff,
    };
  };

  // 총 자산 계산
  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.amount), 0);
  const totalInterestBeforeTax = assets.reduce((sum, asset) => sum + calculateInterest(asset).beforeTax, 0);
  const totalInterestAfterTax = assets.reduce((sum, asset) => sum + calculateInterest(asset).afterTax, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-black">자산관리</h2>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm mb-1 text-black">총 자산</p>
            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalAssets)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm mb-1 text-black">예상 이자 (세전)</p>
            <p className="text-2xl font-bold text-green-600">{formatAmount(totalInterestBeforeTax)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm mb-1 text-black">예상 이자 (세후)</p>
            <p className="text-2xl font-bold text-purple-600">{formatAmount(totalInterestAfterTax)}</p>
            <p className="text-xs mt-1 text-gray-600">세율 15.4% 적용</p>
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'savings' | 'deposit' })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
                required
              >
                <option value="savings">적금</option>
                <option value="deposit">예금</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">은행명</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
                placeholder="예: 국민은행"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">금액 (원)</label>
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
                    const parsed = parseAmountInput(e.target.value);
                    setFormData({ ...formData, amount: parsed });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-black bg-white pr-8"
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">원</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">연 이자율 (%)</label>
              <input
                type="number"
                value={formData.interest_rate || ''}
                onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
                placeholder="0.00"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-black">만기일</label>
              <input
                type="date"
                value={formData.maturity_date}
                onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {editingAsset ? '수정' : '추가'}
            </button>
            {editingAsset && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            )}
          </div>
        </form>

        {/* 자산 목록 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-black">유형</th>
                <th className="text-left p-2 text-black">은행명</th>
                <th className="text-right p-2 text-black">금액</th>
                <th className="text-right p-2 text-black">이자율</th>
                <th className="text-left p-2 text-black">만기일</th>
                <th className="text-right p-2 text-black">예상 이자 (세전)</th>
                <th className="text-right p-2 text-black">예상 이자 (세후)</th>
                <th className="text-left p-2 text-black">만기까지</th>
                <th className="text-left p-2 text-black">상태</th>
                <th className="text-center p-2 text-black">작업</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4 text-gray-600">
                    등록된 자산이 없습니다.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const interest = calculateInterest(asset);
                  const status = asset.status || 'active';
                  const statusText = status === 'active' ? '활성' : status === 'matured' ? '만기' : '해제';
                  const statusColor = status === 'active' ? 'text-green-600' : status === 'matured' ? 'text-orange-600' : 'text-gray-600';
                  
                  return (
                    <tr key={asset.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-black">{asset.type === 'savings' ? '적금' : '예금'}</td>
                      <td className="p-2 text-black">{asset.bank_name}</td>
                      <td className="p-2 text-right font-semibold text-black">{formatAmount(Number(asset.amount))}</td>
                      <td className="p-2 text-right text-black">{Number(asset.interest_rate).toFixed(2)}%</td>
                      <td className="p-2 text-black">{asset.maturity_date}</td>
                      <td className="p-2 text-right text-green-600">{formatAmount(interest.beforeTax)}</td>
                      <td className="p-2 text-right text-purple-600">{formatAmount(interest.afterTax)}</td>
                      <td className="p-2 text-black">{interest.daysRemaining}일</td>
                      <td className={`p-2 font-semibold ${statusColor}`}>{statusText}</td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-center flex-wrap">
                          {status === 'active' && (
                            <>
                              <button
                                onClick={() => handleMaturity(asset.id)}
                                className="px-2 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                              >
                                만기
                              </button>
                              <button
                                onClick={() => handleClose(asset.id)}
                                className="px-2 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                              >
                                해제
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(asset)}
                            className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
