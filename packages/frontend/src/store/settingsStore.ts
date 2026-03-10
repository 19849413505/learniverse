import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: 'DeepSeek' | 'OpenAI' | 'Custom';
  // Online OCR Engine configs
  ocrEngine: 'tesseract' | 'llm'; // 'tesseract' (offline) or 'llm' (online multi-modal)
  ocrModel: string; // e.g., 'gpt-4o', 'gemini-1.5-pro'
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      provider: 'DeepSeek',
      ocrEngine: 'tesseract',
      ocrModel: 'gpt-4o',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'learniverse-settings',
    }
  )
);
