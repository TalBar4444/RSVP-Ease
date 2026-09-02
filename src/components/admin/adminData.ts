import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Guest } from '../../types/guest';

export type AdminError = {
  kind: 'permission' | 'admin_check' | 'guests';
  message: string;
};

export type AdminData = {
  session: Session | null;
  authReady: boolean;
  isAdmin: boolean;
  adminCheckDone: boolean;
  guests: Guest[];
  guestsLoaded: boolean;
  error: AdminError | null;
  addGuestToCache: (guest: Guest) => void;
  updateGuestGroupInCache: (guestId: string, groupAffiliation: string | null) => void;
  removeGuestFromCache: (guestId: string) => void;
  refreshGuests: () => Promise<void>;
  signOut: () => void;
};

export const AdminDataContext = createContext<AdminData | null>(null);

export function useAdminData(): AdminData {
  const value = useContext(AdminDataContext);
  if (!value) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return value;
}
