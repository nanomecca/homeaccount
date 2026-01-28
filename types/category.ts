export interface Category {
  id: string;
  type: string;
  main_category: string;
  name: string;
  created_at?: string;
}

export interface CategoryFormData {
  type: string;
  main_category: string;
  name: string;
}

// 대분류 목록 (기본값)
export const DEFAULT_MAIN_CATEGORIES: Record<string, string[]> = {
  income: ['급여', '부수입', '투자', '기타'],
  expense: ['식비', '교통', '주거', '통신', '의료', '교육', '쇼핑', '여가', '기타'],
};
