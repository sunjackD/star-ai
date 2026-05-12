import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeName } from '../types';

type ThemeState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'minimal-reference',
      setTheme: (theme) => set({ theme })
    }),
    { name: 'ai-platform-theme' }
  )
);

