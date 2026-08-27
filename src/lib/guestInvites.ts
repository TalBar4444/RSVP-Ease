const RING = '\u{1F48D}';
const WHITE_HEART = '\u{1F90D}';
const LTR = '\u200e';

function getPublicSiteOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return window.location.origin;
}

export function getGuestRsvpUrl(guestId: string): string {
  return `${getPublicSiteOrigin()}/rsvp/${guestId}`;
}

function normalizePhoneDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits;
}

export function toWhatsAppNumber(phone: string): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export function getGuestInviteMessage(_name: string, guestId: string): string {
  const link = getGuestRsvpUrl(guestId);
  return [
    'משפחה וחברים יקרים,',
    `אנחנו שמחים ונרגשים להזמין אתכם לחתונה שלנו ${RING}`,
    'האירוע יתקיים ביום חמישי,',
    'ה-29.10.2026, בבדולינה, רעננה.',
    'קבלת פנים בשעה 19:30.',
    '',
    'נשמח לאישור הגעה בלינק המצורף.',
    `${LTR}${link}`,
    '',
    'מצפים לראותכם,',
    `טל בר ושקד שושן ${WHITE_HEART}`,
  ].join('\n');
}

function prefersWhatsAppWeb(): boolean {
  return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getWhatsAppInviteUrl(name: string, phone: string, guestId: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;

  const text = encodeURIComponent(getGuestInviteMessage(name, guestId));
  if (prefersWhatsAppWeb()) {
    return `https://web.whatsapp.com/send/?phone=${number}&text=${text}`;
  }
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}

export function getSmsInviteUrl(name: string, phone: string, guestId: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;

  const text = getGuestInviteMessage(name, guestId);
  return `sms:+${number}?body=${encodeURIComponent(text)}`;
}
