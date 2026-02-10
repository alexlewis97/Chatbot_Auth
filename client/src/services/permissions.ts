import { supabase } from './supabase';
import { getCurrentUserId } from './auth';
import type { ChatbotPermission } from '../types';

export async function getPermissionsForChatbot(chatbotId: string): Promise<ChatbotPermission[]> {
  const { data, error } = await supabase
    .from('chatbot_permissions')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .order('granted_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAllPermissions(): Promise<ChatbotPermission[]> {
  const { data, error, status } = await supabase
    .from('chatbot_permissions')
    .select('*')
    .order('granted_at', { ascending: false });
  console.log('[chatbot_permissions] select response:', { data, error, status });
  if (error) throw new Error(`שגיאה בטעינת הרשאות (${status}): ${error.message}`);
  return data ?? [];
}

export async function grantUserPermission(chatbotId: string, userId: string, permissionType = 'use'): Promise<ChatbotPermission> {
  const grantedBy = await getCurrentUserId();
  const { data, error } = await supabase
    .from('chatbot_permissions')
    .insert([{ chatbot_id: chatbotId, user_id: userId, permission_type: permissionType, granted_by: grantedBy }])
    .select();
  if (error) throw error;
  return data![0];
}

export async function grantGroupPermission(chatbotId: string, groupId: string, permissionType = 'use'): Promise<ChatbotPermission> {
  const grantedBy = await getCurrentUserId();
  const { data, error } = await supabase
    .from('chatbot_permissions')
    .insert([{ chatbot_id: chatbotId, group_id: groupId, permission_type: permissionType, granted_by: grantedBy }])
    .select();
  if (error) throw error;
  return data![0];
}

export async function revokePermission(id: string): Promise<void> {
  const { error } = await supabase.from('chatbot_permissions').delete().eq('id', id);
  if (error) throw error;
}
