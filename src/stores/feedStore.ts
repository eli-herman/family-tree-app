import { create } from 'zustand';
import { FeedItem } from '../types';

interface FeedState {
  items: FeedItem[];
  isLoading: boolean;
  setItems: (items: FeedItem[]) => void;
  addItem: (item: FeedItem) => void;
  updateItem: (id: string, updates: Partial<FeedItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  toggleHeart: (itemId: string, userId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  items: [],
  isLoading: false,
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
}));
