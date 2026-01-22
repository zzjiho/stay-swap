export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',

  // 숙소
  LISTINGS: '/listings',
  LISTING_DETAIL: (id: string) => `/listings/${id}`,
  NEW_LISTING: '/listings/new',
  EDIT_LISTING: (id: string) => `/listings/${id}/edit`,

  // 교환
  EXCHANGES: '/exchanges',
  EXCHANGE_DETAIL: (id: string) => `/exchanges/${id}`,

  // 메시지
  MESSAGES: '/messages',

  // 프로필
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // 구독
  SUBSCRIPTION: '/subscription',

  // 알림
  NOTIFICATIONS: '/notifications',
} as const;
