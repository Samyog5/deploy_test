
export interface User {
  email: string;
  name: string;
  isLoggedIn: boolean;
  balance: number;
  lastSpinTimestamp?: number;
  spinCount?: number;
  spinWindowStart?: number;
  isAdmin?: boolean;
  loginTimestamp?: number; // Epoch time when the user logged in
}

export interface Reward {
  id: number;
  label: string;
  type: 'balance' | 'none';
  value: number;
  weight: number;
  premium?: boolean;
}

export interface AnnouncementConfig {
  enabled: boolean;
  imageUrl: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export enum ThemeColors {
  JUNGLE = '#002e2c',
  FOREST = '#004d40',
  TEAL = '#00897b',
  GOLD = '#D4AF37',
  EMERALD = '#00C853',
  WHITE = '#FFFFFF',
  PALE = '#A5D6A7',
  SLATE = '#2F4F4F'
}
