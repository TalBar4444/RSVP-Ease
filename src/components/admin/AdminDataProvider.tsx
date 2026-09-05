import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { REALTIME_SUBSCRIBE_STATES, type Session } from '@supabase/supabase-js';
import { fetchGuests, isCurrentUserAdmin } from '../../lib/adminGuests';
import {
  applyGuestRealtimeEvent,
  replayGuestRealtimeEvents,
  sortGuests,
  upsertGuestInList,
  removeGuestFromList,
  type GuestRealtimePayload,
} from '../../lib/adminGuestRealtime';
import { supabase } from '../../lib/supabaseClient';
import type { Guest } from '../../types/guest';
import { AdminDataContext, type AdminError } from './adminData';

type GuestRealtimeSync = {
  live: boolean;
  buffer: GuestRealtimePayload[];
};

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
  const guestsLoadedRef = useRef(false);
  const realtimeRef = useRef<GuestRealtimeSync | null>(null);
  const catchUpGenerationRef = useRef(0);

  const userId = session?.user.id ?? null;

  const clearAdminData = useCallback(() => {
    loadGenerationRef.current += 1;
    catchUpGenerationRef.current += 1;
    readyUserIdRef.current = null;
    userIdRef.current = null;
    guestsLoadedRef.current = false;
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
        guestsLoadedRef.current = false;
        setGuests([]);
        setGuestsLoaded(false);
      }

      try {
        const allowed = await isCurrentUserAdmin();
        if (!isCurrent()) return;

        setIsAdmin(allowed);
        setAdminCheckDone(true);

        if (!allowed) {
          readyUserIdRef.current = currentUserId;
          guestsLoadedRef.current = false;
          setGuests([]);
          setGuestsLoaded(false);
          setError({ kind: 'permission', message: 'אין הרשאת מנהל לחשבון זה.' });
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

  const catchUpGuests = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const generation = ++catchUpGenerationRef.current;
    const sync = realtimeRef.current;
    if (sync) sync.live = false;

    const isCurrent = () =>
      catchUpGenerationRef.current === generation && userIdRef.current === currentUserId;

    try {
      const snapshot = await fetchGuests();
      if (!isCurrent()) return;

      setGuests(() => {
        let next = sortGuests(snapshot);
        if (sync && realtimeRef.current === sync) {
          next = replayGuestRealtimeEvents(next, sync.buffer.splice(0));
          sync.live = true;
        }
        return next;
      });
      guestsLoadedRef.current = true;
      setGuestsLoaded(true);
      setError((current: AdminError | null) => (current?.kind === 'guests' ? null : current));
      readyUserIdRef.current = currentUserId;
    } catch (err) {
      console.error(err);
      if (!isCurrent()) return;
      if (sync && realtimeRef.current === sync) {
        setGuests((current) => {
          const next = replayGuestRealtimeEvents(current, sync.buffer.splice(0));
          sync.live = true;
          return next;
        });
      }
      setError({ kind: 'guests', message: 'אירעה שגיאה בטעינת נתוני האורחים.' });
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || !userId) return;

    let cancelled = false;
    const sync: GuestRealtimeSync = { live: false, buffer: [] };
    realtimeRef.current = sync;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        await supabase.realtime.setAuth(accessToken);
      }
      if (cancelled) return;

      channel = supabase
        .channel('admin-guests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guests' },
          (payload) => {
            if (realtimeRef.current !== sync) return;
            const change = payload as GuestRealtimePayload;
            if (!sync.live) {
              sync.buffer.push(change);
              return;
            }
            setGuests((current) => applyGuestRealtimeEvent(current, change));
          },
        )
        .subscribe((status) => {
          if (realtimeRef.current !== sync) return;
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            void catchUpGuests();
            return;
          }
          if (
            (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
              status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) &&
            !guestsLoadedRef.current
          ) {
            void catchUpGuests();
          }
        });

      if (cancelled) {
        void supabase.removeChannel(channel);
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (realtimeRef.current === sync) realtimeRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [catchUpGuests, isAdmin, userId]);

  const upsertGuestInCache = useCallback((guest: Guest) => {
    if (!userIdRef.current) return;
    setGuests((current) => upsertGuestInList(current, guest));
  }, []);

  const removeGuestFromCache = useCallback((guestId: string) => {
    if (!userIdRef.current) return;
    setGuests((current) => removeGuestFromList(current, guestId));
  }, []);

  const refreshGuests = useCallback(async () => {
    await catchUpGuests();
  }, [catchUpGuests]);

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
      addGuestToCache: upsertGuestInCache,
      updateGuestInCache: upsertGuestInCache,
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
      upsertGuestInCache,
      removeGuestFromCache,
      refreshGuests,
      signOut,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
