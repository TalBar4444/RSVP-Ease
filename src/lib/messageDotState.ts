import type { GuestOutreach } from './guestOutreach';
import { getMessageTemplate, tracksGuestLinkOpen, type MessageType } from './messageTemplates';

export type MessageDotState = 'empty' | 'sent' | 'opened';

export type MessageDotDescription = {
  state: MessageDotState;
  label: string;
};

function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

export function describeMessageDot(type: MessageType, outreach: GuestOutreach): MessageDotDescription {
  const template = getMessageTemplate(type);
  const send = outreach.sends[type];
  const opened = Boolean(outreach.linkOpenedAt) && tracksGuestLinkOpen(type);

  if (opened && outreach.linkOpenedAt) {
    const openedText = `${template.shortLabel} · נפתח ${formatDayMonth(outreach.linkOpenedAt)}`;
    const sentText = send ? ` · נשלח ${formatDayMonth(send.sentAt)}` : '';
    return { state: 'opened', label: `${openedText}${sentText}` };
  }

  if (send) {
    return { state: 'sent', label: `${template.shortLabel} · נשלח ${formatDayMonth(send.sentAt)}` };
  }

  return { state: 'empty', label: `${template.shortLabel} · טרם נשלח` };
}
