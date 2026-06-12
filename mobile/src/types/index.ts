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

export enum SimService {
  MOBILE_MONEY = 'MOBILE_MONEY',
  DATA_BUNDLES = 'DATA_BUNDLES',
  AIRTIME = 'AIRTIME',
  BILL_PAYMENT = 'BILL_PAYMENT',
  TV = 'TV',
}

export interface SimCard {
  id: string;
  operator: Operator;
  phoneNumber: string;
  cashBalance: number;
  airtimeBalance?: number;
  dataBalance?: number;
  dataUnit?: string;
  enabledServices: SimService[];
}

export interface SimTransaction {
  id: string;
  type: TransactionType;
  service: SimService;
  amount: number;
  commission?: number;
  fee?: number;
  timestamp: string;
  label: string;
}

