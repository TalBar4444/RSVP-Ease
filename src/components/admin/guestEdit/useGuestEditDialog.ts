import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteGuest, isGuestUpdateConflictError, updateGuest } from '../../../lib/adminGuests';
import type { Guest } from '../../../types/guest';
import { guestDraftsEqual, guestToDraft, validateGuestDraft, type GuestDraft } from './guestDraft';

const REMOTE_UPDATE_MESSAGE = 'האורח עודכן במקום אחר.';

export function useGuestEditDialog({
  guest,
  onClose,
  onUpdated,
  onDeleted,
}: {
  guest: Guest;
  onClose: () => void;
  onUpdated: (guest: Guest) => void;
  onDeleted: (guestId: string) => void;
}) {
  const [draft, setDraft] = useState<GuestDraft>(() => guestToDraft(guest));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const requestIdRef = useRef(0);
  const mutationInFlightRef = useRef(false);
  const casUpdatedAtRef = useRef(guest.updated_at);
  const baselineDraftRef = useRef(guestToDraft(guest));
  const busy = saving || deleting;
  const countsLocked = draft.status === 'declined';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    if (guest.updated_at === casUpdatedAtRef.current) return;

    if (guestDraftsEqual(draft, baselineDraftRef.current)) {
      const nextDraft = guestToDraft(guest);
      casUpdatedAtRef.current = guest.updated_at;
      baselineDraftRef.current = nextDraft;
      setDraft(nextDraft);
      setRemoteChanged(false);
      return;
    }

    setRemoteChanged(true);
  }, [draft, guest]);

  const applyRemoteGuest = useCallback(
    (nextGuest: Guest) => {
      const nextDraft = guestToDraft(nextGuest);
      casUpdatedAtRef.current = nextGuest.updated_at;
      baselineDraftRef.current = nextDraft;
      setDraft(nextDraft);
      setRemoteChanged(false);
      setFormError(null);
    },
    [],
  );

  const closeDialog = useCallback(() => {
    if (busy) return;
    onCloseRef.current();
  }, [busy]);

  const handleBackdropClick = () => {
    if (showConfirm) return;
    closeDialog();
  };

  const handleReloadFromRemote = () => {
    applyRemoteGuest(guest);
  };

  const handleSave = async () => {
    if (mutationInFlightRef.current) return;

    const result = validateGuestDraft(draft);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    mutationInFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setSaving(true);
    setFormError(null);

    try {
      const updated = await updateGuest(guest.id, result.input, casUpdatedAtRef.current);
      if (requestId !== requestIdRef.current) return;
      onUpdated(updated);
      onCloseRef.current();
    } catch (err) {
      console.error(err);
      if (requestId !== requestIdRef.current) return;
      if (isGuestUpdateConflictError(err)) {
        onUpdated(err.current);
        setRemoteChanged(true);
        return;
      }
      setFormError('לא ניתן לשמור את פרטי האורח. נסו שוב בעוד רגע.');
    } finally {
      if (requestId === requestIdRef.current) {
        mutationInFlightRef.current = false;
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (mutationInFlightRef.current) return;

    mutationInFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteGuest(guest.id);
      if (requestId !== requestIdRef.current) return;
      setShowConfirm(false);
      onDeleted(guest.id);
    } catch (err) {
      console.error(err);
      if (requestId !== requestIdRef.current) return;
      setDeleteError('לא ניתן להסיר את האורח. נסו שוב בעוד רגע.');
    } finally {
      if (requestId === requestIdRef.current) {
        mutationInFlightRef.current = false;
        setDeleting(false);
      }
    }
  };

  const handleCloseConfirm = () => {
    if (deleting) return;
    setShowConfirm(false);
    setDeleteError(null);
  };

  return {
    draft,
    setDraft,
    formError,
    saving,
    deleting,
    deleteError,
    showConfirm,
    setShowConfirm,
    remoteChanged,
    remoteChangedMessage: REMOTE_UPDATE_MESSAGE,
    busy,
    countsLocked,
    dialogRef,
    closeDialog,
    handleBackdropClick,
    handleSave,
    handleDelete,
    handleCloseConfirm,
    handleReloadFromRemote,
  };
}
