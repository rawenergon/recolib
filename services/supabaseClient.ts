import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vhmpdpakvvxaaeqphoix.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_LV_XRnRuE5hnYXJExqHLBQ_OXxry8W6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);