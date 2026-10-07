import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { isMessageType, type MessageType } from './messageTemplates';
import { supabase } from './supabaseClient';

export const MESSAGE_CHANNELS = ['whatsapp', 'sms', 'copy'] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export function isMessageChannel(value: unknown): value is MessageChannel {
  return value === 'whatsapp' || value === 'sms' || value === 'copy';
}

export type GuestMessageSend = {
  channel: MessageChannel;
  sentAt: string;
};

export type GuestOutreach = {
  sends: Partial<Record<MessageType, GuestMessageSend>>;
  linkOpenedAt: string | null;
};

export const EMPTY_OUTREACH: GuestOutreach = Object.freeze({
  sends: Object.freeze({}),
  linkOpenedAt: null,
}) as GuestOutreach;

export function getGuestOutreach(
  outreachByGuestId: Record<string, GuestOutreach>,
  guestId: string,
): GuestOutreach {
  return outreachByGuestId[guestId] ?? EMPTY_OUTREACH;
}

function emptyOutreach(): GuestOutreach {
  return { sends: {}, linkOpenedAt: null };
}

function cloneOutreach(current: GuestOutreach): GuestOutreach {
  return { sends: { ...current.sends }, linkOpenedAt: current.linkOpenedAt };
}

export type GuestSendRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;
export type GuestOpenRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

function parseSendRow(data: unknown): {
  guestId: string;
  messageType: MessageType;
  channel: MessageChannel;
  sentAt: string;
} | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  if (typeof row.guest_id !== 'string') return null;
  if (typeof row.message_type !== 'string' || !isMessageType(row.message_type)) return null;
  if (!isMessageChannel(row.channel)) return null;
  if (typeof row.sent_at !== 'string' || row.sent_at.length === 0) return null;
  return {
    guestId: row.guest_id,
    messageType: row.message_type,
    channel: row.channel,
    sentAt: row.sent_at,
  };
}

function parseOpenRow(data: unknown): { guestId: string; openedAt: string } | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  if (typeof row.guest_id !== 'string') return null;
  if (typeof row.opened_at !== 'string' || row.opened_at.length === 0) return null;
  return { guestId: row.guest_id, openedAt: row.opened_at };
}

export function upsertSendInOutreach(
  outreachByGuestId: Record<string, GuestOutreach>,
  guestId: string,
  messageType: MessageType,
  send: GuestMessageSend,
): Record<string, GuestOutreach> {
  const current = cloneOutreach(outreachByGuestId[guestId] ?? emptyOutreach());
  current.sends[messageType] = send;
  return { ...outreachByGuestId, [guestId]: current };
}

export function removeSendFromOutreach(
  outreachByGuestId: Record<string, GuestOutreach>,
  guestId: string,
  messageType: MessageType,
): Record<string, GuestOutreach> {
  const existing = outreachByGuestId[guestId];
  if (!existing?.sends[messageType]) return outreachByGuestId;
  const current = cloneOutreach(existing);
  delete current.sends[messageType];
  return { ...outreachByGuestId, [guestId]: current };
}

export function setLinkOpenedInOutreach(
  outreachByGuestId: Record<string, GuestOutreach>,
  guestId: string,
  openedAt: string,
): Record<string, GuestOutreach> {
  const current = cloneOutreach(outreachByGuestId[guestId] ?? emptyOutreach());
  if (current.linkOpenedAt) return outreachByGuestId;
  current.linkOpenedAt = openedAt;
  return { ...outreachByGuestId, [guestId]: current };
}

export function removeGuestFromOutreach(
  outreachByGuestId: Record<string, GuestOutreach>,
  guestId: string,
): Record<string, GuestOutreach> {
  if (!(guestId in outreachByGuestId)) return outreachByGuestId;
  const next = { ...outreachByGuestId };
  delete next[guestId];
  return next;
}

export function applySendRealtimeEvent(
  outreachByGuestId: Record<string, GuestOutreach>,
  payload: GuestSendRealtimePayload,
): Record<string, GuestOutreach> {
  if (payload.eventType === 'DELETE') {
    const guestId = payload.old.guest_id;
    const messageType = payload.old.message_type;
    if (typeof guestId !== 'string' || typeof messageType !== 'string' || !isMessageType(messageType)) {
      return outreachByGuestId;
    }
    return removeSendFromOutreach(outreachByGuestId, guestId, messageType);
  }

  const parsed = parseSendRow(payload.new);
  if (!parsed) return outreachByGuestId;
  return upsertSendInOutreach(outreachByGuestId, parsed.guestId, parsed.messageType, {
    channel: parsed.channel,
    sentAt: parsed.sentAt,
  });
}

export function applyOpenRealtimeEvent(
  outreachByGuestId: Record<string, GuestOutreach>,
  payload: GuestOpenRealtimePayload,
): Record<string, GuestOutreach> {
  if (payload.eventType === 'DELETE') {
    const guestId = payload.old.guest_id;
    if (typeof guestId !== 'string') return outreachByGuestId;
    const existing = outreachByGuestId[guestId];
    if (!existing?.linkOpenedAt) return outreachByGuestId;
    const current = cloneOutreach(existing);
    current.linkOpenedAt = null;
    return { ...outreachByGuestId, [guestId]: current };
  }

  const parsed = parseOpenRow(payload.new);
  if (!parsed) return outreachByGuestId;
  return setLinkOpenedInOutreach(outreachByGuestId, parsed.guestId, parsed.openedAt);
}

export function replayOutreachRealtimeEvents(
  outreachByGuestId: Record<string, GuestOutreach>,
  sends: readonly GuestSendRealtimePayload[],
  opens: readonly GuestOpenRealtimePayload[],
): Record<string, GuestOutreach> {
  let next = outreachByGuestId;
  for (const event of sends) {
    next = applySendRealtimeEvent(next, event);
  }
  for (const event of opens) {
    next = applyOpenRealtimeEvent(next, event);
  }
  return next;
}

function buildOutreachMap(
  sends: unknown[],
  opens: unknown[],
): Record<string, GuestOutreach> {
  const map: Record<string, GuestOutreach> = {};

  for (const row of sends) {
    const parsed = parseSendRow(row);
    if (!parsed) throw new Error('Invalid guest_message_sends row from database.');
    if (!map[parsed.guestId]) map[parsed.guestId] = emptyOutreach();
    map[parsed.guestId].sends[parsed.messageType] = {
      channel: parsed.channel,
      sentAt: parsed.sentAt,
    };
  }

  for (const row of opens) {
    const parsed = parseOpenRow(row);
    if (!parsed) throw new Error('Invalid guest_link_opens row from database.');
    if (!map[parsed.guestId]) map[parsed.guestId] = emptyOutreach();
    if (!map[parsed.guestId].linkOpenedAt) {
      map[parsed.guestId].linkOpenedAt = parsed.openedAt;
    }
  }

  return map;
}

export function isMissingOutreachRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /schema cache|guest_message_sends|guest_link_opens/i.test(message)
  );
}

export async function fetchOutreachByGuestId(): Promise<Record<string, GuestOutreach>> {
  const [sendsResult, opensResult] = await Promise.all([
    supabase.from('guest_message_sends').select('guest_id, message_type, channel, sent_at'),
    supabase.from('guest_link_opens').select('guest_id, opened_at'),
  ]);

  if (sendsResult.error) throw sendsResult.error;
  if (opensResult.error) throw opensResult.error;

  return buildOutreachMap(sendsResult.data ?? [], opensResult.data ?? []);
}

export async function upsertGuestMessageSend(input: {
  guestId: string;
  messageType: MessageType;
  channel: MessageChannel;
}): Promise<GuestMessageSend> {
  const sentAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('guest_message_sends')
    .upsert(
      {
        guest_id: input.guestId,
        message_type: input.messageType,
        channel: input.channel,
        sent_at: sentAt,
      },
      { onConflict: 'guest_id,message_type' },
    )
    .select('channel, sent_at')
    .single();

  if (error) throw error;
  const parsed = parseSendRow({
    guest_id: input.guestId,
    message_type: input.messageType,
    channel: data?.channel ?? input.channel,
    sent_at: data?.sent_at ?? sentAt,
  });
  if (!parsed) throw new Error('Invalid guest_message_sends row from database.');
  return { channel: parsed.channel, sentAt: parsed.sentAt };
}

export async function deleteGuestMessageSend(
  guestId: string,
  messageType: MessageType,
): Promise<void> {
  const { error } = await supabase
    .from('guest_message_sends')
    .delete()
    .eq('guest_id', guestId)
    .eq('message_type', messageType);

  if (error) throw error;
}

export function guestHasSentMessage(
  outreach: GuestOutreach,
  messageType: MessageType,
): boolean {
  return Boolean(outreach.sends[messageType]);
}

export function guestHasOpenedLink(outreach: GuestOutreach): boolean {
  return outreach.linkOpenedAt != null;
}
