// Observable state store — single source of truth for filters + data

export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState() { return state; },
    setState(updates) {
      state = { ...state, ...updates };
      listeners.forEach(fn => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}

export const DEFAULT_FILTERS = {
  datePreset: 'ytd',          // ytd | q_current | q_prev | l12m | custom
  dateStart: null,
  dateEnd: null,
  regions: [],
  requesterRoles: [],
  campaignTypes: [],
  solutionAreas: [],
  industries: [],
  lobs: [],
  assetTypes: [],
  statuses: [],
  teamMembers: [],
  search: ''
};
