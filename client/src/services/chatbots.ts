import { supabase } from './supabase';
import { getCurrentUserId } from './auth';
import type { Chatbot } from '../types';

export async function getChatbots(): Promise<Chatbot[]> {
  const { data, error } = await supabase.from('chatbots').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createChatbot(bot: Pick<Chatbot, 'name' | 'subject' | 'description'>): Promise<Chatbot> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('chatbots')
    .insert([{ ...bot, created_by: userId }])
    .select();
  if (error) throw error;
  return data![0];
}

export async function updateChatbot(id: string, updates: Partial<Pick<Chatbot, 'name' | 'subject' | 'description' | 'is_active'>>): Promise<Chatbot> {
  const { data, error } = await supabase.from('chatbots').update(updates).eq('id', id).select();
  if (error) throw error;
  return data![0];
}

export async function deleteChatbot(id: string): Promise<void> {
  const { error } = await supabase.from('chatbots').delete().eq('id', id);
  if (error) throw error;
}
