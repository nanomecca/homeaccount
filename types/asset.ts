export interface Asset {
  id: string;
  type: 'savings' | 'deposit'; // 적금, 예금
  bank_name: string;
  amount: number;
  interest_rate: number; // 연 이자율 (%)
  maturity_date: string; // 만기일 (YYYY-MM-DD)
  created_at?: string;
  updated_at?: string;
}

export interface AssetFormData {
  type: 'savings' | 'deposit';
  bank_name: string;
  amount: number;
  interest_rate: number;
  maturity_date: string;
}
