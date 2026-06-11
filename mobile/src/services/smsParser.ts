import {
  Transaction,
  TransactionType,
  Operator,
  MobileMoneyOperation,
  SyncStatus,
} from '../types';

const OPERATOR_KEYWORDS: Record<Operator, RegExp[]> = {
  [Operator.AIRTEL]: [/AIRTEL/i, /Airtel Money/i],
  [Operator.ORANGE]: [/ORANGE/i, /Orange Money/i],
  [Operator.VODACOM]: [/VODACOM/i, /M[- ]?PESA/i, /Mpesa/i],
  [Operator.AFRICELL]: [/AFRICELL/i],
};

const MOBILE_MONEY_PATTERNS: RegExp[] = [
  /d[eé]p[ôo]t/i,
  /retrait/i,
  /re[çc]u de/i,
  /transfert/i,
  /paiement/i,
  /achat/i,
];

const AIRTIME_PATTERNS: RegExp[] = [
  /recharge effectu[eé]e/i,
  /cr[eé]dit envoy[eé]/i,
  /vente de cr[eé]dit/i,
  /recharge/i,
];

const BUNDLE_PATTERNS: RegExp[] = [
  /(\d+)\s*(MB|GB|M[ée]gas|Gigas)/i,
  /forfait internet/i,
  /forfait (maxi|mini|midi|soir)/i,
  /volume/i,
  /pack data/i,
];

const BILL_PAYMENT_PATTERNS: RegExp[] = [
  /SNEL/i,
  /REGIDESO/i,
  /facture/i,
];

function detectOperator(text: string): Operator | null {
  for (const [operator, patterns] of Object.entries(OPERATOR_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return operator as Operator;
      }
    }
  }
  return null;
}

function detectTransactionType(text: string): TransactionType {
  for (const pattern of BUNDLE_PATTERNS) {
    if (pattern.test(text)) return TransactionType.BUNDLE;
  }
  for (const pattern of AIRTIME_PATTERNS) {
    if (pattern.test(text)) return TransactionType.AIRTIME;
  }
  for (const pattern of BILL_PAYMENT_PATTERNS) {
    if (pattern.test(text)) return TransactionType.BILL_PAYMENT;
  }
  for (const pattern of MOBILE_MONEY_PATTERNS) {
    if (pattern.test(text)) return TransactionType.MOBILE_MONEY;
  }
  return TransactionType.MOBILE_MONEY;
}

function extractAmount(text: string): number | undefined {
  const match = text.match(/(\d[\d,. ]*)\s*(FC|CDF|USD|\$)/i);
  if (match) {
    const cleaned = match[1].replace(/[., ]/g, '');
    return parseInt(cleaned, 10);
  }
  const numberMatch = text.match(/montant\s*[:\u00a0]?\s*(\d+)/i);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  return undefined;
}

function extractVolume(text: string): { volume: number; unit: string } | undefined {
  const match = text.match(/(\d+[\.]?\d*)\s*(MB|GB|M[ée]gas?|Gigas?)/i);
  if (match) {
    return {
      volume: parseFloat(match[1]),
      unit: match[2].toUpperCase(),
    };
  }
  return undefined;
}

function extractBalance(text: string): number | undefined {
  const match = text.match(/(?:solde|balance|reste)\s*(?:\w+\s*)?[:\u00a0]?\s*(\d[\d,. ]*)/i);
  if (match) {
    const cleaned = match[1].replace(/[., ]/g, '');
    return parseInt(cleaned, 10);
  }
  return undefined;
}

function calculateCommission(
  type: TransactionType,
  amount?: number
): number | undefined {
  if (!amount) return undefined;
  switch (type) {
    case TransactionType.BUNDLE:
      return Math.round(amount * 0.05);
    case TransactionType.AIRTIME:
      return Math.round(amount * 0.03);
    case TransactionType.BILL_PAYMENT:
      return Math.round(amount * 0.01);
    default:
      return undefined;
  }
}

export function parseSms(smsText: string, sender?: string): Transaction | null {
  try {
    const operator = detectOperator(smsText);
    if (!operator) return null;

    const type = detectTransactionType(smsText);
    const amount = extractAmount(smsText);
    const volume = extractVolume(smsText);
    const newBalance = extractBalance(smsText);
    const commission = calculateCommission(type, amount);

    const transaction: Transaction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operator,
      type,
      amount,
      currency: amount ? 'CDF' : undefined,
      volume: volume?.volume,
      volumeUnit: volume?.unit,
      commission,
      newBalance,
      rawSms: smsText,
      timestamp: new Date().toISOString(),
      syncStatus: SyncStatus.PENDING,
    };

    return transaction;
  } catch {
    return null;
  }
}
