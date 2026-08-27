import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { fetchGuests, isCurrentUserAdmin } from '../../lib/adminGuests';
import { computeGuestKpis } from '../../lib/guestAnalytics';
import { supabase } from '../../lib/supabaseClient';
import type { Guest } from '../../types/guest';
import AddGuestForm from './AddGuestForm';
import AdminLogin from './AdminLogin';
import AdminShell, { GoldDivider } from './AdminShell';
import GuestList from './GuestList';

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGuestAdded = (guest: Guest) => {
    setGuests((current) => [...current, guest].sort((a, b) => a.name.localeCompare(b.name, 'he')));
  };

  const handleGuestGroupUpdated = (guestId: string, groupAffiliation: string | null) => {
    setGuests((current) =>
      current.map((guest) =>
        guest.id === guestId ? { ...guest, group_affiliation: groupAffiliation } : guest,
      ),
    );
  };

  const handleGuestRemoved = (guestId: string) => {
    setGuests((current) => current.filter((guest) => guest.id !== guestId));
  };

  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  const metrics = useMemo(() => computeGuestKpis(guests), [guests]);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setAdminCheckDone(false);
      setGuests([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setAdminCheckDone(false);

    async function verifyAdmin() {
      try {
        const allowed = await isCurrentUserAdmin();
        if (cancelled) return;
        setIsAdmin(allowed);
        setError(allowed ? null : 'אין הרשאת מנהל לחשבון זה.');
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setIsAdmin(false);
        setError('לא ניתן לבדוק הרשאות מנהל.');
      } finally {
        if (!cancelled) setAdminCheckDone(true);
      }
    }

    void verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !isAdmin) return;

    async function loadGuests() {
      setLoading(true);
      setError(null);

      try {
        setGuests(await fetchGuests());
      } catch (err) {
        console.error(err);
        setError('אירעה שגיאה בטעינת נתוני האורחים.');
      } finally {
        setLoading(false);
      }
    }

    void loadGuests();
  }, [session, isAdmin]);

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

  if (!adminCheckDone || (isAdmin && loading && !error)) {
    return (
      <AdminShell compact>
        <p className="animate-pulse text-lg text-[#6F7C91]">טוען את לוח הבקרה...</p>
      </AdminShell>
    );
  }

  if (!isAdmin || error) {
    return (
      <AdminShell compact>
        <div className="max-w-md text-center">
          <p className="font-medium leading-relaxed text-rose-700">
            {error ?? 'אין הרשאת מנהל לחשבון זה.'}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 rounded-lg border border-[#C5A059]/80 bg-white/70 px-4 py-2 text-sm font-medium text-[#082D58] transition-colors hover:bg-white"
          >
            יציאה
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className="mb-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-start">
            <p className="text-sm text-[#6F7C91]">החתונה של טל ושקד</p>
            <h1 className="mt-1 text-3xl font-medium">לוח ניהול RSVP</h1>
            <p className="mt-1 text-[#6F7C91]">סקירת אורחים, אישורים והעדפות קולינריות</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <img src="/logo-cropped.png" alt="" className="h-[4.5rem] w-auto object-contain" />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-[#C5A059]/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#082D58] transition-colors hover:bg-white"
            >
              יציאה
            </button>
          </div>
        </div>
        <GoldDivider className="mx-auto mt-6 max-w-xs sm:mx-0 sm:max-w-[16rem]" />
      </header>

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
        </article>
      </div>

      <AddGuestForm onGuestAdded={handleGuestAdded} />
      <GuestList guests={guests} onGroupUpdated={handleGuestGroupUpdated} onDeleted={handleGuestRemoved} />
    </AdminShell>
  );
}
