import AsyncStorage from '@react-native-async-storage/async-storage';
import { SimCard, SimService, Operator } from '../types';

let simsState: SimCard[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const simStore = {
  async loadSims() {
    try {
      const stored = await AsyncStorage.getItem('@panoptes_sims');
      if (stored) {
        simsState = JSON.parse(stored);
        notify();
      }
    } catch (e) {
      console.error('Failed to load SIMs from storage', e);
    }
  },

  getSims(): SimCard[] {
    return simsState;
  },

  setSims(newSims: SimCard[]) {
    simsState = newSims;
    notify();
    AsyncStorage.setItem('@panoptes_sims', JSON.stringify(simsState)).catch(e => {
      console.error('Failed to save SIMs to storage', e);
    });
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
        enabledServices: [...services, SimService.GENERAL_MESSAGES],
      });
    });
    this.setSims(newSimList);
  },

  toggleService(simId: string, service: SimService) {
    if (service === SimService.GENERAL_MESSAGES) return;
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
    this.setSims(simsState);
  },

  deleteSim(simId: string) {
    simsState = simsState.filter((sim) => sim.id !== simId);
    this.setSims(simsState);
  },

  updateSimNumber(simId: string, newNumber: string) {
    simsState = simsState.map((sim) => {
      if (sim.id !== simId) return sim;
      return { ...sim, phoneNumber: newNumber };
    });
    this.setSims(simsState);
  },

  updateSim(simId: string, newNumber: string, services: SimService[]) {
    simsState = simsState.map((sim) => {
      if (sim.id !== simId) return sim;
      const merged = services.includes(SimService.GENERAL_MESSAGES) ? services : [...services, SimService.GENERAL_MESSAGES];
      return { ...sim, phoneNumber: newNumber, enabledServices: merged };
    });
    this.setSims(simsState);
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
