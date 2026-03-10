import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: 'DeepSeek' | 'OpenAI' | 'Custom';
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      provider: 'DeepSeek',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'learniverse-settings',
    }
  )
);
