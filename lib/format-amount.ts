// 금액 포맷팅 유틸리티 함수

// 숫자를 원화 형식으로 포맷팅 (천 단위 구분자)
export function formatAmountInput(value: number | string): string {
  if (!value && value !== 0) return '';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(numValue)) return '';
  return numValue.toLocaleString('ko-KR');
}

// 포맷팅된 문자열을 숫자로 변환
export function parseAmountInput(value: string): number {
  if (!value) return 0;
  const numValue = parseFloat(value.replace(/,/g, ''));
  return isNaN(numValue) ? 0 : numValue;
}

// 숫자만 추출 (입력 필터링용)
export function extractNumbers(value: string): string {
  return value.replace(/[^\d.]/g, '');
}
