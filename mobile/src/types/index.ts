export enum Operator {
  AIRTEL = 'AIRTEL',
  ORANGE = 'ORANGE',
  VODACOM = 'VODACOM',
  AFRICELL = 'AFRICELL',
}

export enum TransactionType {
  MOBILE_MONEY = 'MOBILE_MONEY',
  AIRTIME = 'AIRTIME',
  BUNDLE = 'BUNDLE',
  BILL_PAYMENT = 'BILL_PAYMENT',
}

export enum MobileMoneyOperation {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
}

export enum SyncStatus {
  PENDING = 0,
  SYNCED = 1,
}

export interface Transaction {
  id: string;
  operator: Operator;
  type: TransactionType;
  amount?: number;
  currency?: string;
  volume?: number;
  volumeUnit?: string;
  fee?: number;
  commission?: number;
  newBalance?: number;
  rawSms: string;
  timestamp: string;
  syncStatus: SyncStatus;
}

export interface FailedParse {
  id: string;
  rawSms: string;
  operator: Operator;
  error: string;
  timestamp: string;
  syncStatus: SyncStatus;
}

export interface StockStatus {
  cashBalance: number;
  airtimeBalance: number;
  dataBalance: number;
  dataUnit: string;
  operator: Operator;
}

export type ServiceProfile = 'business' | 'family' | 'partner';

