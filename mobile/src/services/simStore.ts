import { SimCard, SimService, Operator } from '../types';

let simsState: SimCard[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const simStore = {
  getSims(): SimCard[] {
    return simsState;
  },

  setSims(newSims: SimCard[]) {
    simsState = newSims;
    notify();
  },

  addSims(
    operator: Operator,
    phoneNumbers: string[],
    services: SimService[] = [],
  ) {
    const newSimList = [...simsState];
    phoneNumbers.forEach((phoneNumber, i) => {
      newSimList.push({
        id: `sim-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        operator,
        phoneNumber,
        cashBalance: 0,
        airtimeBalance: 0,
        dataBalance: 0,
        dataUnit: 'GB',
        enabledServices: [...services],
      });
    });
    this.setSims(newSimList);
  },

  toggleService(simId: string, service: SimService) {
    simsState = simsState.map((sim) => {
      if (sim.id !== simId) return sim;
      const has = sim.enabledServices.includes(service);
      return {
        ...sim,
        enabledServices: has
          ? sim.enabledServices.filter((s) => s !== service)
          : [...sim.enabledServices, service],
      };
    });
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
