// 공통 타입 정의
export type UserRole = 'USER' | 'HOST' | 'ADMIN';

export type HouseType = 'APT' | 'HOUSE' | 'VILLA' | 'OFFICETEL';

export type SwapStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type NotificationType =
  | 'LIKE'
  | 'SWAP'
  | 'BOOKING'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'TEST_NOTIFICATION';
