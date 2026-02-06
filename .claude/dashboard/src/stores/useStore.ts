import { create } from 'zustand';

export interface AIEvent {
  id: string;
  timestamp: number;
  type: 'model:start' | 'model:complete' | 'model:error' | 'cache:hit' | 'route:decision' | 'index:progress';
  model?: 'claude' | 'local-7b' | 'remote-14b' | 'embeddings';
  data: Record<string, unknown>;
}

export interface ModelStats {
  calls: number;
  tokens: number;
  avgDuration: number;
  errors: number;
  lastActive: number;
}

export interface ActiveFlow {
  id: string;
  from: string;
  to: string;
  startTime: number;
  progress: number;
}

interface DashboardStore {
  // Connection status
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Events
  events: AIEvent[];
  addEvent: (event: AIEvent) => void;
  clearEvents: () => void;

  // Model stats
  stats: Record<string, ModelStats>;
  updateStats: (model: string, update: Partial<ModelStats>) => void;

  // Active data flows (for particle animations)
  activeFlows: ActiveFlow[];
  addFlow: (flow: ActiveFlow) => void;
  removeFlow: (id: string) => void;
  updateFlowProgress: (id: string, progress: number) => void;

  // Active models (currently processing)
  activeModels: Set<string>;
  setModelActive: (model: string, active: boolean) => void;

  // Cache stats
  cacheHits: number;
  cacheMisses: number;
  incrementCache: (hit: boolean) => void;

  // Totals
  totalTokensSaved: number;
  addTokensSaved: (tokens: number) => void;
}

export const useStore = create<DashboardStore>((set) => ({
  // Connection
  connected: false,
  setConnected: (connected) => set({ connected }),

  // Events (keep last 100)
  events: [],
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 100)
  })),
  clearEvents: () => set({ events: [] }),

  // Model stats
  stats: {
    'claude': { calls: 0, tokens: 0, avgDuration: 0, errors: 0, lastActive: 0 },
    'local-7b': { calls: 0, tokens: 0, avgDuration: 0, errors: 0, lastActive: 0 },
    'remote-14b': { calls: 0, tokens: 0, avgDuration: 0, errors: 0, lastActive: 0 },
    'embeddings': { calls: 0, tokens: 0, avgDuration: 0, errors: 0, lastActive: 0 },
  },
  updateStats: (model, update) => set((state) => ({
    stats: {
      ...state.stats,
      [model]: { ...state.stats[model], ...update }
    }
  })),

  // Active flows
  activeFlows: [],
  addFlow: (flow) => set((state) => ({
    activeFlows: [...state.activeFlows, flow]
  })),
  removeFlow: (id) => set((state) => ({
    activeFlows: state.activeFlows.filter(f => f.id !== id)
  })),
  updateFlowProgress: (id, progress) => set((state) => ({
    activeFlows: state.activeFlows.map(f =>
      f.id === id ? { ...f, progress } : f
    )
  })),

  // Active models
  activeModels: new Set(),
  setModelActive: (model, active) => set((state) => {
    const newSet = new Set(state.activeModels);
    if (active) newSet.add(model);
    else newSet.delete(model);
    return { activeModels: newSet };
  }),

  // Cache
  cacheHits: 0,
  cacheMisses: 0,
  incrementCache: (hit) => set((state) => ({
    cacheHits: state.cacheHits + (hit ? 1 : 0),
    cacheMisses: state.cacheMisses + (hit ? 0 : 1),
  })),

  // Totals
  totalTokensSaved: 0,
  addTokensSaved: (tokens) => set((state) => ({
    totalTokensSaved: state.totalTokensSaved + tokens
  })),
}));
