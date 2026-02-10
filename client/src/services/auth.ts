import { supabase } from './supabase';

const ANONYMOUS_ID = '00000000-0000-0000-0000-000000000000';

export const isSkipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

export async function getCurrentUserId(): Promise<string> {
  if (isSkipAuth) return ANONYMOUS_ID;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('לא מחובר');
  return user.id;
}
