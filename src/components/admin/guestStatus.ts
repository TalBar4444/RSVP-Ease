import type { GuestStatus } from '../../types/guest';

export const GUEST_STATUSES = ['pending', 'attending', 'declined'] as const;

export const STATUS_LABELS: Record<GuestStatus, string> = {
  attending: 'מגיע',
  declined: 'לא מגיע',
  pending: 'ממתין',
};

export const STATUS_STYLES: Record<GuestStatus, string> = {
  attending: 'border-[#082D58] bg-[#082D58] text-white',
  declined: 'border-[#C5A059]/70 bg-white/60 text-[#082D58]',
  pending: 'border-[#C5A059] bg-[#C5A059]/15 text-[#8A6A2E]',
};
