import { useDialogFocusTrap } from '../../../hooks/useDialogFocusTrap';
import type { Guest } from '../../../types/guest';
import { IconClose, IconTrash } from '../AdminIcons';
import ConfirmDialog from '../ConfirmDialog';
import GuestEditForm from './GuestEditForm';
import { useGuestEditDialog } from './useGuestEditDialog';

export default function GuestEditDialog({
  guest,
  groupOptions,
  onClose,
  onUpdated,
  onDeleted,
}: {
  guest: Guest;
  groupOptions: string[];
  onClose: () => void;
  onUpdated: (guest: Guest) => void;
  onDeleted: (guestId: string) => void;
}) {
  const {
    draft,
    setDraft,
    formError,
    saving,
    deleting,
    deleteError,
    showConfirm,
    setShowConfirm,
    remoteChanged,
    remoteChangedMessage,
    busy,
    countsLocked,
    dialogRef,
    closeDialog,
    handleBackdropClick,
    handleSave,
    handleDelete,
    handleCloseConfirm,
    handleReloadFromRemote,
  } = useGuestEditDialog({ guest, onClose, onUpdated, onDeleted });

  useDialogFocusTrap({
    dialogRef,
    active: !showConfirm,
    onEscape: closeDialog,
    autoFocus: false,
    restoreFocus: false,
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#082D58]/45 px-3 py-3 sm:px-4 sm:py-6"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          handleBackdropClick();
        }}
        role="presentation"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-edit-title"
          tabIndex={-1}
          className="max-h-[28rem] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E6DCCB] bg-white shadow-[0_16px_40px_rgba(8,45,88,0.18)] focus:outline-none"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E6DCCB] bg-white px-5 py-4">
              <h3 id="guest-edit-title" className="text-lg font-medium text-[#082D58]">
                עריכת אורח
              </h3>
              <button
                type="button"
                onClick={closeDialog}
                disabled={busy}
                aria-label="סגירה"
                className="rounded-lg p-2 text-[#6F7C91] transition-colors hover:bg-[#FBF8F2] disabled:opacity-60"
              >
                <IconClose />
              </button>
            </header>

            {remoteChanged ? (
              <div
                role="status"
                className="flex items-start justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3"
              >
                <p className="text-sm font-medium text-amber-900">{remoteChangedMessage}</p>
                <button
                  type="button"
                  onClick={handleReloadFromRemote}
                  disabled={busy}
                  className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  טען מחדש
                </button>
              </div>
            ) : null}

            <GuestEditForm
              draft={draft}
              groupOptions={groupOptions}
              saving={saving}
              formError={formError}
              countsLocked={countsLocked}
              onDraftChange={setDraft}
            />

            <div className="flex justify-center px-5 pb-4">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium leading-5 text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
              >
                <IconTrash />
                מחיקה
              </button>
            </div>

            <div className="sticky bottom-0 z-10 flex justify-center gap-2 border-t border-[#E6DCCB] bg-white px-5 py-3">
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="rounded-lg border border-[#C5A059]/80 bg-white px-5 py-2.5 text-sm font-medium text-[#082D58] transition-colors hover:bg-[#FBF8F2] disabled:opacity-60"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#082D58] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b3a70] disabled:opacity-60"
              >
                {saving ? 'שומר...' : 'שמירה'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        message={`אתה בטוח שאתה רוצה למחוק את ${guest.name}?`}
        confirmLabel="מחק"
        cancelLabel="ביטול"
        loading={deleting}
        loadingLabel="מוחק..."
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={handleCloseConfirm}
      />
    </>
  );
}
