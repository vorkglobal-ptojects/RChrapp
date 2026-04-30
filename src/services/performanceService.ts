import { supabase } from '../lib/supabase';
import { PerformanceRecord } from '../types';

export async function getPerformance(userId?: string): Promise<PerformanceRecord[]> {
  let query = supabase.from('performance').select('*, profiles!performance_user_id_fkey(name), evaluator:profiles!performance_evaluator_id_fkey(name)');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    userName: d.profiles?.name,
    evaluatorId: d.evaluator_id,
    evaluatorName: d.evaluator?.name,
    score: d.score,
    rating: d.rating,
    feedback: d.feedback,
    hrFeedback: d.hr_feedback,
    selfEvaluation: d.self_evaluation,
    goals: d.goals,
    status: d.status,
    createdAt: d.created_at
  }));
}

export async function savePerformance(perf: Partial<PerformanceRecord>): Promise<void> {
  const { id, ...data } = perf;
  const payload = {
    user_id: data.userId,
    evaluator_id: data.evaluatorId,
    score: data.score,
    rating: data.rating,
    feedback: data.feedback,
    hr_feedback: data.hrFeedback,
    self_evaluation: data.selfEvaluation,
    goals: data.goals,
    status: data.status
  };

  if (id) {
    const { error } = await supabase.from('performance').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('performance').insert(payload);
    if (error) throw error;
  }
}
