import { useEffect, useMemo, useRef } from 'react';
import { computeGuestKpis } from '../../lib/guestAnalytics';
import { wedding } from '../../theme/wedding';
import AddGuestForm from './AddGuestForm';
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
      <header className="mb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-start">
            <p className="text-sm text-[#6F7C91]">החתונה של {wedding.coupleShort}</p>
            <h1 className="mt-1 text-3xl font-medium">לוח ניהול RSVP</h1>
            <p className="mt-1 text-[#6F7C91]">סקירת אורחים, אישורים והעדפות קולינריות</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <img src="/logo-cropped.png" alt="" className="h-[4.5rem] w-auto object-contain" />
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-[#C5A059]/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#082D58] transition-colors hover:bg-white"
            >
              יציאה
            </button>
          </div>
        </div>
        <GoldDivider className="mx-auto mt-6 max-w-xs sm:mx-0 sm:max-w-[16rem]" />
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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-5">
          <p className="text-sm font-medium text-[#6F7C91]">סה״כ מגיעים</p>
          <p className="mt-2 text-3xl font-medium text-[#082D58]">{metrics.totalConfirmed}</p>
          <p className="mt-1 text-xs text-[#9AA6B8]">מבוגרים וילדים שאישרו הגעה</p>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-5">
          <p className="text-sm font-medium text-[#6F7C91]">מבוגרים וילדים</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-medium">{metrics.totalAdults}</p>
            <span className="text-sm text-[#6F7C91]">מבוגרים</span>
            <span className="text-[#C5A059]">/</span>
            <p className="text-3xl font-medium">{metrics.totalChildren}</p>
            <span className="text-sm text-[#6F7C91]">ילדים</span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-5">
          <p className="text-sm font-medium text-[#6F7C91]">ממתינים לתשובה</p>
          <p className="mt-2 text-3xl font-medium text-[#8A6A2E]">{metrics.pendingInvitations}</p>
          <p className="mt-1 text-xs text-[#9AA6B8]">טרם השיבו להזמנה</p>
        </article>

        <article className="rounded-2xl border border-[#E6DCCB] bg-white/55 p-5">
          <p className="text-sm font-medium text-[#6F7C91]">העדפות קולינריות</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>
              <span className="font-medium">{metrics.vegetarianCount}</span> צמחוני
            </span>
            <span>
              <span className="font-medium">{metrics.veganCount}</span> טבעוני
            </span>
            <span>
              <span className="font-medium">{metrics.glutenFreeCount}</span> ללא גלוטן
            </span>
          </div>
          <p className="mt-2 text-xs text-[#9AA6B8]">לפי הזמנה, לא לפי מספר סועדים</p>
        </article>
      </div>

      <AddGuestForm onGuestAdded={addGuestToCache} />
      <GuestList guests={guests} onGuestUpdated={updateGuestInCache} onDeleted={removeGuestFromCache} />
    </AdminShell>
  );
}
