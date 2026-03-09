import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserState {
  xp: number;
  streak: number;
  gems: number;
  lastActiveDate: string | null;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addGems: (amount: number) => void;
  updateLastActive: (date: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      xp: 0,
      streak: 0,
      gems: 0,
      lastActiveDate: null,
      addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      updateLastActive: (date) => set({ lastActiveDate: date }),
    }),
    {
      name: 'learniverse-user-storage',
    }
  )
);
