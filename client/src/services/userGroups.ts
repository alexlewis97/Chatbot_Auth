import { supabase } from './supabase';
import { getCurrentUserId } from './auth';
import type { UserGroup, UserGroupMember } from '../types';

export async function getUserGroups(): Promise<UserGroup[]> {
  const { data, error, status } = await supabase.from('user_groups').select('*').order('name');
  console.log('[user_groups] select response:', { data, error, status });
  if (error) throw new Error(`שגיאה בטעינת קבוצות (${status}): ${error.message}`);
  return data ?? [];
}

export async function createUserGroup(group: Pick<UserGroup, 'name' | 'description'>): Promise<UserGroup> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('user_groups')
    .insert([{ ...group, created_by: userId }])
    .select();
  if (error) throw error;
  return data![0];
}

export async function deleteUserGroup(id: string): Promise<void> {
  // Remove members first, then the group
  await supabase.from('user_group_members').delete().eq('group_id', id);
  const { error } = await supabase.from('user_groups').delete().eq('id', id);
  if (error) throw error;
}

export async function getGroupMembers(groupId: string): Promise<UserGroupMember[]> {
  const { data, error } = await supabase
    .from('user_group_members')
    .select('*')
    .eq('group_id', groupId);
  if (error) throw error;
  return data ?? [];
}

export async function addGroupMember(groupId: string, userId: string): Promise<UserGroupMember> {
  const { data, error } = await supabase
    .from('user_group_members')
    .insert([{ group_id: groupId, user_id: userId }])
    .select();
  if (error) throw error;
  return data![0];
}

export async function removeGroupMember(id: string): Promise<void> {
  const { error } = await supabase.from('user_group_members').delete().eq('id', id);
  if (error) throw error;
}
