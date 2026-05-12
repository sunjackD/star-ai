import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';

type AuthState = {
  token?: string;
  profile?: UserProfile;
  setSession: (token: string, profile: UserProfile) => void;
  setProfile: (profile: UserProfile) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: undefined,
      profile: undefined,
      setSession: (token, profile) => set({ token, profile }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ token: undefined, profile: undefined })
    }),
    { name: 'ai-platform-auth' }
  )
);

