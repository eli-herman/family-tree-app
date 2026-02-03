import { create } from 'zustand';
import { FeedItem, Comment } from '../types';
import { mockFeedItems } from '../utils/mockData';

interface FeedState {
  items: FeedItem[];
  isLoading: boolean;
  error: string | null;

  // Existing actions
  setItems: (items: FeedItem[]) => void;
  addItem: (item: FeedItem) => void;
  updateItem: (id: string, updates: Partial<FeedItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  toggleHeart: (itemId: string, userId: string) => void;

  // Async loading
  loadData: () => Promise<void>;

  // Selectors
  getItemsByAuthor: (memberId: string) => FeedItem[];
  getComments: (itemId: string) => Comment[];
  getItemById: (itemId: string) => FeedItem | undefined;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  toggleHeart: (itemId, userId) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item;
        const hearts = item.hearts.includes(userId)
          ? item.hearts.filter((id) => id !== userId)
          : [...item.hearts, userId];
        return { ...item, hearts };
      }),
    })),

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate async loading with 100ms delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ items: mockFeedItems, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load feed data',
        isLoading: false,
      });
    }
  },

  getItemsByAuthor: (memberId) => get().items.filter((item) => item.authorId === memberId),

  getComments: (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    return item?.comments || [];
  },

  getItemById: (itemId) => get().items.find((i) => i.id === itemId),
}));
