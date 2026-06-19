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
  GENERAL_MESSAGES = 'GENERAL_MESSAGES',
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

export type WatchStatus = 'pending' | 'active' | 'rejected' | 'revoked';

export interface WatchRelation {
  id: number;
  watcher_phone: string;
  target_phone: string;
  status: WatchStatus;
  created_at: string;
  confirmed_at: string | null;
  revoked_at: string | null;
}

export interface ForwardedSms {
  id: number;
  target_phone: string;
  sender: string;
  message: string;
  received_at: string;
  created_at: string;
}

export interface RegisteredDevice {
  id: number;
  phone_number: string;
  device_secret: string;
  fcm_token: string | null;
  created_at: string;
}

export interface GeneralMessage {
  id: string;
  sender: string;
  message: string;
  operator: Operator | null;
  timestamp: string;
  simId?: string;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

export interface PaymentItemRequest {
  device_id: number;
  service_id: number;
  duration_days: number;
}

export interface CreatePaymentResponse {
  payment_id: number;
  reference: string;
  amount: number;
  network: string;
  status: string;
}

export interface Subscription {
  id: number;
  device_phone: string;
  service_name: string;
  service_code: string;
  start_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended';
  days_remaining: number;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice_reference: string;
  amount: number;
  network: string;
  status: string;
  transaction_reference: string;
  notes: string;
  created_at: string;
  confirmed_at: string | null;
  items: PaymentItem[];
}

export interface PaymentItem {
  id: number;
  device_phone: string;
  service_name: string;
  service_code: string;
  amount: number;
  duration_days: number;
}

