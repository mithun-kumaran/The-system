import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://svkdpkpcknufdstujqau.supabase.co';
const defaultSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a2Rwa3Bja251ZmRzdHVqcWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzY5MjQsImV4cCI6MjA4NzExMjkyNH0.0po_BQcgUGUjp2APqXWAg4QLKwRCULgaji4DKLgFNgc';
const rawUrl = typeof process.env.EXPO_PUBLIC_SUPABASE_URL === 'string' ? process.env.EXPO_PUBLIC_SUPABASE_URL.trim() : '';
const rawKey =
  typeof process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'string'
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim()
    : '';
const isLocalUrl = /localhost|127\.0\.0\.1/i.test(rawUrl);
const hasProtocol = /^https?:\/\//i.test(rawUrl);
const supabaseUrl = rawUrl && hasProtocol && !isLocalUrl ? rawUrl : defaultSupabaseUrl;
const supabaseAnonKey = rawKey || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const sanityCheckCommunities = async () => {
  const { data, error } = await supabase.from('communities').select('id, name').limit(10);
  if (error) {
    console.log('Supabase communities check failed', error.message);
    return null;
  }
  console.log('Supabase communities check', data);
  return data;
};
