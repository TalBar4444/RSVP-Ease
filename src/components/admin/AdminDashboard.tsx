import { useEffect, useMemo, useRef } from 'react';
import { computeGuestKpis } from '../../lib/guestAnalytics';
import { wedding } from '../../theme/wedding';
import AddGuestForm from './AddGuestForm';
import { DIET_LABELS } from './guestDiet';
import { useAdminData } from './adminData';
import AdminLogin from './AdminLogin';
import AdminShell, { GoldDivider } from './AdminShell';
import GuestList from './GuestList';

export default function AdminDashboard() {
  const {
    session,
    authReady,
    isAdmin,
    adminCheckDone,
    guests,
    guestsLoaded,
    error,
    addGuestToCache,
    updateGuestInCache,
    removeGuestFromCache,
    refreshGuests,
    signOut,
  } = useAdminData();

  const hadCacheOnMount = useRef(guestsLoaded);

  useEffect(() => {
    if (!hadCacheOnMount.current || !isAdmin) return;
    void refreshGuests();
  }, [isAdmin, refreshGuests]);

  const metrics = useMemo(() => computeGuestKpis(guests), [guests]);
  const blockingError = error?.kind === 'permission' || error?.kind === 'admin_check';
  const guestsError = error?.kind === 'guests' ? error : null;

  if (!authReady) {
    return (
      <AdminShell compact>
        <p className="animate-pulse text-lg text-[#6F7C91]">טוען את לוח הבקרה...</p>
      </AdminShell>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  if (!adminCheckDone || (isAdmin && !guestsLoaded && !guestsError)) {
    return (
      <AdminShell compact>
        <p className="animate-pulse text-lg text-[#6F7C91]">טוען את לוח הבקרה...</p>
      </AdminShell>
    );
  }

  if (!isAdmin || blockingError) {
    return (
      <AdminShell compact>
        <div className="max-w-md text-center">
          <p className="font-medium leading-relaxed text-rose-700">
            {error?.message ?? 'אין הרשאת מנהל לחשבון זה.'}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 rounded-lg border border-[#C5A059]/80 bg-white/70 px-4 py-2 text-sm font-medium text-[#082D58] transition-colors hover:bg-white"
          >
            יציאה
          </button>
        </div>
      </AdminShell>
    );
  }

  if (!guestsLoaded && guestsError) {
    return (
      <AdminShell compact>
        <div className="max-w-md text-center">
          <p className="font-medium leading-relaxed text-rose-700">{guestsError.message}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void refreshGuests()}
              className="rounded-lg bg-[#082D58] px-4 py-2 text-sm font-medium text-white"
            >
              נסו שוב
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-[#C5A059]/80 bg-white/70 px-4 py-2 text-sm font-medium text-[#082D58] transition-colors hover:bg-white"
            >
              יציאה
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className="mb-5 lg:mb-8">
        <div className="flex items-center justify-between gap-3 sm:items-end">
          <div className="min-w-0 text-start">
            <p className="text-xs text-[#6F7C91] sm:text-sm">החתונה של {wedding.coupleShort}</p>
            <h1 className="mt-0.5 text-2xl font-medium sm:mt-1 sm:text-3xl">לוח ניהול RSVP</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-3">
            <img src="/logo-cropped.png" alt="" className="h-12 w-auto object-contain sm:h-[4.5rem]" />
            <button
              type="button"
              onClick={signOut}
              className="min-h-9 rounded-lg border border-[#C5A059]/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#082D58] transition-colors hover:bg-white lg:min-h-0"
            >
              יציאה
            </button>
          </div>
        </div>
        <GoldDivider className="mx-0 mt-4 max-w-[16rem] sm:mt-6" />
      </header>

      {guestsError ? (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-rose-700">{guestsError.message}</p>
          <button
            type="button"
            onClick={() => void refreshGuests()}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
          >
            נסו שוב
          </button>
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-4 lg:mb-8 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-3 sm:p-5">
          <p className="text-xs font-medium text-[#6F7C91] sm:text-sm">סה״כ מגיעים</p>
          <p className="mt-1 text-2xl font-medium text-[#082D58] sm:mt-2 sm:text-3xl">{metrics.totalConfirmed}</p>
          <p className="mt-1 hidden text-xs text-[#9AA6B8] sm:block">מבוגרים וילדים שאישרו הגעה</p>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-3 sm:p-5">
          <p className="text-xs font-medium text-[#6F7C91] sm:text-sm">מבוגרים וילדים</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 sm:mt-2 sm:gap-x-2 sm:gap-y-1">
            <p className="text-2xl font-medium sm:text-3xl">{metrics.totalAdults}</p>
            <span className="text-xs text-[#6F7C91] sm:text-sm">מבוגרים</span>
            <span className="text-[#C5A059]">/</span>
            <p className="text-2xl font-medium sm:text-3xl">{metrics.totalChildren}</p>
            <span className="text-xs text-[#6F7C91] sm:text-sm">ילדים</span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-3 sm:p-5">
          <p className="text-xs font-medium text-[#6F7C91] sm:text-sm">ממתינים לתשובה</p>
          <p className="mt-1 text-2xl font-medium text-[#8A6A2E] sm:mt-2 sm:text-3xl">{metrics.pendingInvitations}</p>
          <p className="mt-1 hidden text-xs text-[#9AA6B8] sm:block">טרם השיבו להזמנה</p>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-3 sm:p-5">
          <p className="text-xs font-medium text-[#6F7C91] sm:text-sm">העדפות קולינריות</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs sm:mt-3 sm:gap-x-4 sm:gap-y-1 sm:text-sm">
            <span>
              <span className="font-medium">{metrics.vegetarianCount}</span> {DIET_LABELS.vegetarian}
            </span>
            <span>
              <span className="font-medium">{metrics.veganCount}</span> {DIET_LABELS.vegan}
            </span>
            <span>
              <span className="font-medium">{metrics.glutenFreeCount}</span> {DIET_LABELS.glutenFree}
            </span>
          </div>
          <p className="mt-2 hidden text-xs text-[#9AA6B8] sm:block">לפי הזמנה, לא לפי מספר סועדים</p>
        </article>
      </div>

      <AddGuestForm onGuestAdded={addGuestToCache} />
      <GuestList guests={guests} onGuestUpdated={updateGuestInCache} onDeleted={removeGuestFromCache} />
    </AdminShell>
  );
}
