import { supabase } from './supabase';
import type { UserProfile } from '../types';

export async function getUserProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('user_profiles').select('*').order('email');
  if (error) throw error;
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
