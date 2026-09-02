import { getMessageTemplate, type MessageType } from './messageTemplates';

export type { MessageType };

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

export function getGuestMessage(type: MessageType, guestId: string): string {
  const template = getMessageTemplate(type);
  const rsvpUrl = template.includesRsvpLink ? getGuestRsvpUrl(guestId) : undefined;
  return template.build(rsvpUrl);
}

function prefersWhatsAppWeb(): boolean {
  return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getWhatsAppInviteUrl(
  phone: string,
  guestId: string,
  messageType: MessageType = 'invitation',
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;

  const text = encodeURIComponent(getGuestMessage(messageType, guestId));
  if (prefersWhatsAppWeb()) {
    return `https://web.whatsapp.com/send/?phone=${number}&text=${text}`;
  }
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}

let whatsappWindow: Window | null = null;

function isStoredWhatsAppWindowOpen(): boolean {
  if (!whatsappWindow) return false;
  try {
    return !whatsappWindow.closed;
  } catch {
    whatsappWindow = null;
    return false;
  }
}

export function openWhatsAppChat(url: string): void {
  if (isStoredWhatsAppWindowOpen() && whatsappWindow) {
    try {
      whatsappWindow.location.href = url;
      whatsappWindow.focus();
      return;
    } catch {
      // WhatsApp Web may isolate the opener (COOP); fall through and open again.
      whatsappWindow = null;
    }
  }

  const opened = window.open(url, 'rsvp-whatsapp');
  if (opened) {
    whatsappWindow = opened;
    try {
      opened.focus();
    } catch {
      // Focus can fail on a cross-origin window; the tab may still have opened.
    }
    return;
  }

  // Popup blocked, or COOP returned null after opening a detached tab.
  // Do not store null — the next click will try again.
}

export function getSmsInviteUrl(
  phone: string,
  guestId: string,
  messageType: MessageType = 'invitation',
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;

  const text = getGuestMessage(messageType, guestId);
  return `sms:+${number}?body=${encodeURIComponent(text)}`;
}
