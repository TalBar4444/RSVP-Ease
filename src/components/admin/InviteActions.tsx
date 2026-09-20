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

  const actionClassName =
    'inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors lg:min-h-0 lg:px-2.5 lg:py-1';

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`${actionClassName} border border-[#C5A059]/80 bg-white/70 text-[#082D58] hover:bg-white`}
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
          className={`${actionClassName} border border-[#082D58] bg-[#082D58] text-white hover:bg-[#0b3a70]`}
        >
          וואטסאפ
        </a>
      ) : null}
      {smsUrl ? (
        <a
          href={smsUrl}
          className={`${actionClassName} border border-[#082D58] bg-[#082D58] text-white hover:bg-[#0b3a70]`}
        >
          הודעה
        </a>
      ) : null}
    </div>
  );
}
