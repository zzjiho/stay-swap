// React Query Key Factory
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Houses
  houses: {
    all: ['houses'] as const,
    lists: () => [...queryKeys.houses.all, 'list'] as const,
    list: (params: any) => [...queryKeys.houses.lists(), params] as const,
    infiniteList: (params: any) =>
      [...queryKeys.houses.lists(), 'infinite', params] as const,
    details: () => [...queryKeys.houses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.houses.details(), id] as const,
    countries: ['houses', 'countries'] as const,
  },

  // Swaps
  swaps: {
    all: ['swaps'] as const,
    list: (type: 'guest' | 'host') => [...queryKeys.swaps.all, type] as const,
    detail: (id: string) => [...queryKeys.swaps.all, 'detail', id] as const,
  },

  // Chat
  chat: {
    rooms: ['chat', 'rooms'] as const,
    messages: (roomId: string) => ['chat', 'messages', roomId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    hasNew: ['notifications', 'hasNew'] as const,
    list: ['notifications', 'list'] as const,
  },

  // Users
  users: {
    me: ['users', 'me'] as const,
  },
} as const;
