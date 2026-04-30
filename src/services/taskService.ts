import { supabase } from '../lib/supabase';
import { Task } from '../types';

export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    completed: d.completed,
    createdAt: d.created_at
  }));
}

export async function addTask(userId: string, title: string): Promise<void> {
  const { error } = await supabase.from('tasks').insert({ user_id: userId, title, completed: false });
  if (error) throw error;
}

export async function toggleTask(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from('tasks').update({ completed }).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
