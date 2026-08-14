import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vhmpdpakvvxaaeqphoix.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_LV_XRnRuE5hnYXJExqHLBQ_OXxry8W6";

// Cookie-backed auth storage: the admin session lives in a cookie so it
// survives page reloads for the whole session and works even where
// localStorage is unavailable (e.g. embedded mobile browsers).
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days; JWTs auto-refresh within it

const cookieStorage = {
  getItem: (key: string): string | null => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  },
  removeItem: (key: string): void => {
    document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
