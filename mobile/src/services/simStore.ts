import { SimCard, SimService, Operator } from '../types';

let simsState: SimCard[] = [];

const listeners = new Set<() => void>();

const OPERATOR_COLORS: Record<string, string> = {
  Airtel: '#E11B22',
  Orange: '#FF7900',
  Vodacom: '#00A94F',
  Africell: '#ED1C24',
};

const OPERATOR_PREFIX: Record<string, string> = {
  Airtel: '99',
  Orange: '89',
  Vodacom: '81',
  Africell: '90',
};

function normalizeOperator(op: string): Operator {
  const map: Record<string, Operator> = {
    Airtel: Operator.AIRTEL,
    Orange: Operator.ORANGE,
    Vodacom: Operator.VODACOM,
    Africell: Operator.AFRICELL,
  };
  return map[op] || Operator.AIRTEL;
}

export const simStore = {
  getSims() {
    return simsState;
  },
  setSims(newSims: SimCard[]) {
    simsState = newSims;
    listeners.forEach((l) => l());
  },
  addSims(operator: 'Airtel' | 'Orange' | 'Vodacom' | 'Africell', count: number, services: SimService[] = [SimService.MOBILE_MONEY, SimService.DATA_BUNDLES, SimService.AIRTIME]) {
    const prefix = OPERATOR_PREFIX[operator] || '81';

    const newSimList = [...simsState];
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      const formattedNum = `+243 ${prefix}${String(randomNum).slice(0, 1)} ${String(randomNum).slice(1, 4)} ${String(randomNum).slice(4)}`;

      newSimList.push({
        id: String(newSimList.length + 1),
        operator: normalizeOperator(operator),
        phoneNumber: formattedNum,
        cashBalance: 150000,
        airtimeBalance: 50,
        dataBalance: 10,
        dataUnit: 'GB',
        enabledServices: services,
      });
    }
    this.setSims(newSimList);
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
