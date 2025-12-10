import { createClient } from '@supabase/supabase-js';

// Configuration:
// For Vite, use import.meta.env instead of process.env
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (SUPABASE_URL === 'https://your-project-url.supabase.co') {
    console.warn('Cypress: Supabase keys are missing. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);