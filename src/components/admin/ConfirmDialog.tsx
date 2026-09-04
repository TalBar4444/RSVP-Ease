import { useRef } from 'react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';

type ConfirmDialogProps = {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  loadingLabel = 'עובד...',
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogFocusTrap({
    dialogRef,
    active: open,
    capture: true,
    onEscape: () => {
      if (loading) return;
      onCancel();
    },
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#082D58]/45 px-4"
      onClick={loading ? undefined : onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-[#E6DCCB] bg-[#FBF8F2] p-6 shadow-[0_16px_40px_rgba(8,45,88,0.18)] focus:outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="text-center text-lg font-medium text-[#082D58]">
          {message}
        </h3>

        {error ? <p className="mt-3 text-center text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#C5A059]/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-[#082D58] transition-colors hover:bg-white disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg border border-rose-400 bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
