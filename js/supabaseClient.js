import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://zpdvqtmxvkzkycvoqvyp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9jyt1HHwYZcvW-nOXl2iMw_LAUSe50Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);