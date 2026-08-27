import { useState } from 'react';
import { getGuestRsvpUrl, getSmsInviteUrl, getWhatsAppInviteUrl } from '../../lib/guestInvites';
import type { Guest } from '../../types/guest';

export default function InviteActions({ guest }: { guest: Guest }) {
  const [copied, setCopied] = useState(false);
  const rsvpUrl = getGuestRsvpUrl(guest.id);
  const whatsappUrl = guest.phone ? getWhatsAppInviteUrl(guest.name, guest.phone, guest.id) : null;
  const smsUrl = guest.phone ? getSmsInviteUrl(guest.name, guest.phone, guest.id) : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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
          target="_blank"
          rel="noreferrer"
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
