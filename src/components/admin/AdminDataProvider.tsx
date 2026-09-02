import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { fetchGuests, isCurrentUserAdmin } from '../../lib/adminGuests';
import { supabase } from '../../lib/supabaseClient';
import type { Guest } from '../../types/guest';
import { AdminDataContext, type AdminError } from './adminData';

function sortGuests(guests: Guest[]): Guest[] {
  return [...guests].sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [error, setError] = useState<AdminError | null>(null);
  const readyUserIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const loadGenerationRef = useRef(0);

  const userId = session?.user.id ?? null;

  const clearAdminData = useCallback(() => {
    loadGenerationRef.current += 1;
    readyUserIdRef.current = null;
    userIdRef.current = null;
    setIsAdmin(false);
    setAdminCheckDone(false);
    setGuests([]);
    setGuestsLoaded(false);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applySession = (nextSession: Session | null) => {
      if (cancelled) return;
      const hadUser = userIdRef.current !== null;
      setSession(nextSession);
      setAuthReady(true);
      if (!nextSession?.user.id && hadUser) {
        clearAdminData();
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          console.error(sessionError);
          applySession(null);
          return;
        }
        applySession(data.session);
      })
      .catch((err) => {
        console.error(err);
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearAdminData]);

  useEffect(() => {
    if (!userId) {
      loadGenerationRef.current += 1;
      userIdRef.current = null;
      return;
    }

    userIdRef.current = userId;
    const currentUserId = userId;
    const generation = ++loadGenerationRef.current;
    const alreadyReady = readyUserIdRef.current === currentUserId;
    const isCurrent = () =>
      loadGenerationRef.current === generation && userIdRef.current === currentUserId;

    async function loadForUser() {
      if (!alreadyReady) {
        setAdminCheckDone(false);
        setError(null);
      }

      try {
        const allowed = await isCurrentUserAdmin();
        if (!isCurrent()) return;

        setIsAdmin(allowed);
        setAdminCheckDone(true);

        if (!allowed) {
          readyUserIdRef.current = currentUserId;
          setGuests([]);
          setGuestsLoaded(false);
          setError({ kind: 'permission', message: 'אין הרשאת מנהל לחשבון זה.' });
          return;
        }

        try {
          const nextGuests = await fetchGuests();
          if (!isCurrent()) return;
          setGuests(nextGuests);
          setGuestsLoaded(true);
          setError(null);
          readyUserIdRef.current = currentUserId;
        } catch (err) {
          console.error(err);
          if (!isCurrent()) return;
          setError({ kind: 'guests', message: 'אירעה שגיאה בטעינת נתוני האורחים.' });
        }
      } catch (err) {
        console.error(err);
        if (!isCurrent()) return;
        setIsAdmin(false);
        setAdminCheckDone(true);
        setError({ kind: 'admin_check', message: 'לא ניתן לבדוק הרשאות מנהל.' });
      }
    }

    void loadForUser();
    return () => {
      loadGenerationRef.current += 1;
    };
  }, [userId]);

  const addGuestToCache = useCallback((guest: Guest) => {
    if (!userIdRef.current) return;
    setGuests((current) => sortGuests([...current, guest]));
  }, []);

  const updateGuestGroupInCache = useCallback((guestId: string, groupAffiliation: string | null) => {
    if (!userIdRef.current) return;
    setGuests((current) =>
      current.map((guest) =>
        guest.id === guestId ? { ...guest, group_affiliation: groupAffiliation } : guest,
      ),
    );
  }, []);

  const removeGuestFromCache = useCallback((guestId: string) => {
    if (!userIdRef.current) return;
    setGuests((current) => current.filter((guest) => guest.id !== guestId));
  }, []);

  const refreshGuests = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const generation = ++loadGenerationRef.current;
    const isCurrent = () =>
      loadGenerationRef.current === generation && userIdRef.current === currentUserId;

    try {
      const nextGuests = await fetchGuests();
      if (!isCurrent()) return;
      setGuests(nextGuests);
      setGuestsLoaded(true);
      setError((current: AdminError | null) => (current?.kind === 'guests' ? null : current));
      readyUserIdRef.current = currentUserId;
    } catch (err) {
      console.error(err);
      if (!isCurrent()) return;
      setError({ kind: 'guests', message: 'אירעה שגיאה בטעינת נתוני האורחים.' });
    }
  }, []);

  const signOut = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      authReady,
      isAdmin,
      adminCheckDone,
      guests,
      guestsLoaded,
      error,
      addGuestToCache,
      updateGuestGroupInCache,
      removeGuestFromCache,
      refreshGuests,
      signOut,
    }),
    [
      session,
      authReady,
      isAdmin,
      adminCheckDone,
      guests,
      guestsLoaded,
      error,
      addGuestToCache,
      updateGuestGroupInCache,
      removeGuestFromCache,
      refreshGuests,
      signOut,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
