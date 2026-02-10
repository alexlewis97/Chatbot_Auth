import { supabase } from './supabase';
import type { UserProfile } from '../types';

export async function getUserProfiles(): Promise<UserProfile[]> {
  const { data, error, status } = await supabase.from('user_groups').select('*').order('name');
  console.log('[user_profiles] select response:', { data, error, status });
  if (error) throw new Error(`שגיאה בטעינת משתמשים (${status}): ${error.message}`);
  return data ?? [];
}

export async function upsertUserProfile(profile: Pick<UserProfile, 'id' | 'email' | 'display_name'>): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ ...profile })
    .select();
  if (error) throw error;
  return data![0];
}
