import { create } from "zustand"

interface NotificationState {
  /** Number of unread notifications, shown as the bell badge. Shared across all mounted bells. */
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  decrementUnread: (by?: number) => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: (by = 1) => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
}))
