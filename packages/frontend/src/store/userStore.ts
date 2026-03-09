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

// Syncs with the NestJS PostgreSQL backend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      gems: 0,
      lastActiveDate: null,
      addXP: async (amount) => {
         set((state) => ({ xp: state.xp + amount }));
         // Background sync to backend
         try {
            await fetch(`${API_BASE}/users/demo-user-id/xp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount })
            });
         } catch (e) {
            console.error('Failed to sync XP to backend', e);
         }
      },
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
