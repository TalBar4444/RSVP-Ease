import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase URL or publishable key in environment variables');
}

const REMEMBER_ME_KEY = 'rsvp-ease-admin-remember-me';
const REMEMBERED_EMAIL_KEY = 'rsvp-ease-admin-email';

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Private mode or blocked storage — ignore.
  }
}

function clearStorage(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getRememberMe(): boolean {
  return readStorage(localStorage, REMEMBER_ME_KEY) !== '0';
}

export function getRememberedEmail(): string {
  return getRememberMe() ? (readStorage(localStorage, REMEMBERED_EMAIL_KEY) ?? '') : '';
}

export function setRememberMe(remember: boolean) {
  writeStorage(localStorage, REMEMBER_ME_KEY, remember ? '1' : '0');
}

export function setRememberedEmail(email: string | null) {
  if (email) {
    writeStorage(localStorage, REMEMBERED_EMAIL_KEY, email);
  } else {
    clearStorage(localStorage, REMEMBERED_EMAIL_KEY);
  }
}

const authStorage = {
  getItem(key: string) {
    return readStorage(localStorage, key) ?? readStorage(sessionStorage, key);
  },
  setItem(key: string, value: string) {
    if (getRememberMe()) {
      clearStorage(sessionStorage, key);
      writeStorage(localStorage, key, value);
    } else {
      clearStorage(localStorage, key);
      writeStorage(sessionStorage, key, value);
    }
  },
  removeItem(key: string) {
    clearStorage(localStorage, key);
    clearStorage(sessionStorage, key);
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: authStorage,
  },
});
