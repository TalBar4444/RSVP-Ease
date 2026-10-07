import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { GuestOutreach, MessageChannel } from '../../lib/guestOutreach';
import type { MessageType } from '../../lib/messageTemplates';
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
  outreachByGuestId: Record<string, GuestOutreach>;
  error: AdminError | null;
  addGuestToCache: (guest: Guest) => void;
  updateGuestInCache: (guest: Guest) => void;
  removeGuestFromCache: (guestId: string) => void;
  recordMessageSend: (guestId: string, messageType: MessageType, channel: MessageChannel) => Promise<void>;
  toggleMessageSend: (guestId: string, messageType: MessageType) => Promise<void>;
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
