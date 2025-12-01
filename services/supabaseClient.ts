import { createClient } from '@supabase/supabase-js';

// Configuration:
// For local development, you can hardcode the keys below.
// For deployment (Vercel, Netlify, etc.), use Environment Variables.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

if (SUPABASE_URL === 'https://your-project-url.supabase.co') {
    console.warn('Cypress: Supabase keys are missing. Please update services/supabaseClient.ts or set environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);