import { Transaction, TransactionType, Operator, MobileMoneyOperation, SyncStatus } from '../types';

interface ParserRule {
  operator: Operator;
  patterns: RegExp[];
  typeMap: Record<string, TransactionType>;
  extractAmount: (text: string) => number | undefined;
  extractBalance: (text: string) => number | undefined;
  extractVolume: (text: string) => { volume: number; unit: string } | undefined;
}

const OPERATOR_KEYWORDS: Record<Operator, RegExp[]> = {
  [Operator.AIRTEL]: [/AIRTEL/i, /Airtel Money/i, /Airtel/i],
  [Operator.ORANGE]: [/ORANGE/i, /Orange Money/i, /Orange/i],
  [Operator.VODACOM]: [/VODACOM/i, /M[- ]?PESA/i, /Mpesa/i, /Vodacom/i],
  [Operator.AFRICELL]: [/AFRICELL/i, /Africell/i],
};

const MOBILE_MONEY_PATTERNS: RegExp[] = [
  /depot/i, /retrait/i, /rec[ué] de/i, /transfert/i,
  /paiement/i, /achat/i, /envoi/i, /re[cç]u/i,
  /confirmation/i, /transaction/i,
];

const AIRTIME_PATTERNS: RegExp[] = [
  /recharge effectu[eé]e/i, /credit envoy[eé]/i,
  /vente de cr[eé]dit/i, /recharge/i, /airtime/i,
  /cr[eé]dit/i,
];

const BUNDLE_PATTERNS: RegExp[] = [
  /(\d+)\s*(MB|GB|M[ée]gas|Gigas)/i,
  /forfait internet/i, /forfait (maxi|mini|midi|soir)/i,
  /volume/i, /pack data/i, /data/i, /internet/i,
];

const BILL_PAYMENT_PATTERNS: RegExp[] = [
  /SNEL/i, /REGIDESO/i, /facture/i, /payement facture/i,
];

// Operator-specific rules for advanced parsing
 const OPERATOR_RULES: Record<string, ParserRule> = {
  [Operator.AIRTEL]: {
    operator: Operator.AIRTEL,
    patterns: [
      /AIRTEL/i, /Airtel Money/i, /AMONEY/i,
      /ACHAT\s+.*OK/i, /TRANSFERT/i, /DEPOT/i,
    ],
    typeMap: {
      'mobile_money': TransactionType.MOBILE_MONEY,
      'airtime': TransactionType.AIRTIME,
      'bundle': TransactionType.BUNDLE,
    },
    extractAmount: (text: string) => {
      const m = text.match(/montant\s*[:\u00a0]?\s*(\d[\d,. ]*)\s*(FC|CDF|\$)?/i)
        || text.match(/(\d[\d,. ]*)\s*(FC|CDF)\s*$/i)
        || text.match(/\b(\d{2,7})\b.*?(?:FC|CDF)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractBalance: (text: string) => {
      const m = text.match(/(?:solde|nouveau solde|balance)\s*[:\u00a0]?\s*(\d[\d,. ]*)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractVolume: (text: string) => {
      const m = text.match(/(\d+[\.]?\d*)\s*(MB|GB|Mo|Go)/i);
      if (m) return { volume: parseFloat(m[1]), unit: m[2].toUpperCase() };
      return undefined;
    },
  },
  [Operator.ORANGE]: {
    operator: Operator.ORANGE,
    patterns: [/ORANGE/i, /Orange Money/i, /OMONEY/i],
    typeMap: {},
    extractAmount: (text: string) => {
      const m = text.match(/montant\s*[:\u00a0]?\s*(\d[\d,. ]*)/i)
        || text.match(/(\d[\d,. ]*)\s*(?:FC|CDF|\$)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractBalance: (text: string) => {
      const m = text.match(/(?:solde|nouveau solde)\s*[:\u00a0]?\s*(\d[\d,. ]*)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractVolume: () => undefined,
  },
  [Operator.VODACOM]: {
    operator: Operator.VODACOM,
    patterns: [/VODACOM/i, /M[- ]?PESA/i, /Mpesa/i],
    typeMap: {},
    extractAmount: (text: string) => {
      const m = text.match(/(\d[\d,. ]*)\s*(?:TSh|TZS|FC|CDF|\$)/i)
        || text.match(/montant\s*[:\u00a0]?\s*(\d+)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractBalance: (text: string) => {
      const m = text.match(/(?:saldo|balance|saldo nuevo)\s*[:\u00a0]?\s*(\d[\d,. ]*)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractVolume: () => undefined,
  },
  [Operator.AFRICELL]: {
    operator: Operator.AFRICELL,
    patterns: [/AFRICELL/i],
    typeMap: {},
    extractAmount: (text: string) => {
      const m = text.match(/(\d[\d,. ]*)\s*(FC|CDF|\$)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractBalance: (text: string) => {
      const m = text.match(/(?:solde|balance)\s*[:\u00a0]?\s*(\d[\d,. ]*)/i);
      if (m) return parseInt(m[1].replace(/[., ]/g, ''), 10);
      return undefined;
    },
    extractVolume: () => undefined,
  },
};

// Fallback parser (generic)
function fallbackParse(text: string): Partial<Transaction> {
  const result: Partial<Transaction> = {};

  // Generic amount extraction
  const amountMatch = text.match(/(\d[\d,. ]*)\s*(FC|CDF|\$)/i);
  if (amountMatch) {
    result.amount = parseInt(amountMatch[1].replace(/[., ]/g, ''), 10);
    result.currency = amountMatch[2].toUpperCase();
  }

  // Generic balance extraction
  const balanceMatch = text.match(/(?:solde|balance|reste)\s*[:\u00a0]?\s*(\d[\d,. ]*)/i);
  if (balanceMatch) {
    result.newBalance = parseInt(balanceMatch[1].replace(/[., ]/g, ''), 10);
  }

  // Generic volume extraction
  const volumeMatch = text.match(/(\d+[\.]?\d*)\s*(MB|GB|Mo|Go)/i);
  if (volumeMatch) {
    result.volume = parseFloat(volumeMatch[1]);
    result.volumeUnit = volumeMatch[2].toUpperCase();
  }

  return result;
}

function detectOperator(text: string): Operator | null {
  for (const [operator, patterns] of Object.entries(OPERATOR_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return operator as Operator;
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

function calculateCommission(type: TransactionType, amount?: number): number | undefined {
  if (!amount) return undefined;
  switch (type) {
    case TransactionType.BUNDLE: return Math.round(amount * 0.05);
    case TransactionType.AIRTIME: return Math.round(amount * 0.03);
    case TransactionType.BILL_PAYMENT: return Math.round(amount * 0.01);
    default: return undefined;
  }
}

export function parseSms(smsText: string, sender?: string): Transaction | null {
  try {
    const operator = detectOperator(smsText);
    if (!operator) return null;

    const type = detectTransactionType(smsText);
    const rule = OPERATOR_RULES[operator];

    let amount: number | undefined;
    let newBalance: number | undefined;
    let volume: { volume: number; unit: string } | undefined;

    if (rule) {
      amount = rule.extractAmount(smsText);
      newBalance = rule.extractBalance(smsText);
      volume = rule.extractVolume(smsText);
    }

    // Fallback if operator rules didn't match
    if (amount === undefined && newBalance === undefined && volume === undefined) {
      const fallback = fallbackParse(smsText);
      amount = fallback.amount;
      newBalance = fallback.newBalance;
      volume = fallback.volume !== undefined ? { volume: fallback.volume, unit: fallback.volumeUnit || 'MB' } : undefined;
    }

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
