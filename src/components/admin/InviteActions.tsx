import { useEffect, useRef, useState } from 'react';
import { getGuestRsvpUrl, getSmsInviteUrl, getWhatsAppInviteUrl, openWhatsAppChat } from '../../lib/guestInvites';
import { DEFAULT_MESSAGE_TYPE, type MessageType } from '../../lib/messageTemplates';
import type { Guest } from '../../types/guest';

export default function InviteActions({
  guest,
  messageType = DEFAULT_MESSAGE_TYPE,
}: {
  guest: Guest;
  messageType?: MessageType;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);
  const rsvpUrl = getGuestRsvpUrl(guest.id);
  const whatsappUrl = guest.phone ? getWhatsAppInviteUrl(guest.phone, guest.id, messageType) : null;
  const smsUrl = guest.phone ? getSmsInviteUrl(guest.phone, guest.id, messageType) : null;

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopied(true);
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-lg border border-[#C5A059]/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-[#082D58] transition-colors hover:bg-white"
      >
        {copied ? 'הועתק' : 'העתקת קישור'}
      </button>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return;
            }
            event.preventDefault();
            openWhatsAppChat(whatsappUrl);
          }}
          className="rounded-lg border border-[#082D58] bg-[#082D58] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#0b3a70]"
        >
          וואטסאפ
        </a>
      ) : null}
      {smsUrl ? (
        <a
          href={smsUrl}
          className="rounded-lg border border-[#082D58] bg-[#082D58] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#0b3a70]"
        >
          הודעה
        </a>
      ) : null}
    </div>
  );
}
