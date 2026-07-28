import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Member } from "@/types/member"

interface AuthState {
  /** JWT access token, kept in memory only (never persisted). */
  accessToken: string | null;
  /** The currently authenticated member (persisted for UX on reload). */
  member: Member | null;
  /** Whether the user currently has an access token. */
  isAuthenticated: boolean;
  /** Stores the access token and member profile after a successful sign-in. */
  setAuth: (token: string, member: Member) => void;
  /** Updates the in-memory access token, e.g. after a refresh. */
  setAccessToken: (token: string) => void;
  /** Updates the cached member profile. */
  setMember: (member: Member) => void;
  /** Clears the access token and member profile on sign-out. */
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      member: null,
      isAuthenticated: false,
      setAuth: (token, member) =>
        set({ accessToken: token, member, isAuthenticated: true }),
      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: true }),
      setMember: (member) => set({ member }),
      clear: () =>
        set({ accessToken: null, member: null, isAuthenticated: false }),
    }),
    {
      name: 'clb-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist only the member profile; the access token stays in memory and
      // is re-obtained via the HttpOnly refresh cookie.
      partialize: (state) => ({ member: state.member }),
    },
  ),
);
