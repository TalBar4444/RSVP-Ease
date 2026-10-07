import { useRef, useState } from 'react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { IconClose } from './AdminIcons';

const INVITATIONS = {
  landscape: {
    id: 'landscape',
    label: 'לרוחב',
    src: '/invitation/invitation-landscape.png',
  },
  portrait: {
    id: 'portrait',
    label: 'לאורך',
    src: '/invitation/invitation-portrait.png',
  },
} as const;

type InvitationId = keyof typeof INVITATIONS;

export default function InvitationPreviewDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<InvitationId>('landscape');
  const invitation = INVITATIONS[view];

  useDialogFocusTrap({
    dialogRef,
    active: open,
    onEscape: onClose,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#082D58]/45 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-preview-title"
        tabIndex={-1}
        className="max-h-[min(44rem,calc(100dvh-2rem))] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E6DCCB] bg-[#FBF8F2] p-5 shadow-[0_16px_40px_rgba(8,45,88,0.18)] focus:outline-none sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3">
          <h3 id="invitation-preview-title" className="text-lg font-medium text-[#082D58]">
            ההזמנה
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#082D58] transition-colors hover:bg-white"
            aria-label="סגירה"
          >
            <IconClose />
          </button>
        </header>

        <div className="mt-4 flex gap-2">
          {(Object.keys(INVITATIONS) as InvitationId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === id
                  ? 'bg-[#082D58] text-white'
                  : 'border border-[#C5A059]/80 bg-white/70 text-[#082D58] hover:bg-white'
              }`}
            >
              {INVITATIONS[id].label}
            </button>
          ))}
        </div>

        <img
          src={invitation.src}
          alt={`הזמנה ${invitation.label}`}
          className="mt-4 max-h-[min(28rem,52dvh)] w-full rounded-xl border border-[#E6DCCB] bg-white object-contain"
        />
      </div>
    </div>
  );
}
