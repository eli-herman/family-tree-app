import { create } from 'zustand';

interface UserPreferences {
  // Placeholder for future preferences
  notificationsEnabled: boolean;
}

interface UserState {
  currentMemberId: string | null;
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;
  setCurrentMemberId: (memberId: string | null) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  notificationsEnabled: true,
};

export const useUserStore = create<UserState>((set) => ({
  currentMemberId: null,
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate async delay (mimics Firebase)
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Hardcoded for MVP - Eli is the current user
      set({
        currentMemberId: 'eli',
        preferences: defaultPreferences,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load user data',
        isLoading: false,
      });
    }
  },

  setCurrentMemberId: (memberId: string | null) => {
    set({ currentMemberId: memberId });
  },

  updatePreferences: (updates: Partial<UserPreferences>) => {
    set((state) => ({
      preferences: { ...state.preferences, ...updates },
    }));
  },
}));
