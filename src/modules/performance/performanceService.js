import { supabase } from '../../services/database/supabaseClient'

// RLS on `results` already restricts rows to the current user's own attempts (or admin).
export async function getMyResultsHistory() {
  const { data, error } = await supabase
    .from('results')
    .select('*, exam_attempts(id, exam_id, submitted_at, status, exams(title, subjects(id, name)))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function computeOverallStats(history) {
  if (history.length === 0) {
    return { totalExams: 0, averagePercentage: 0, highest: 0, lowest: 0, totalQuestionsAttempted: 0 }
  }
  const percentages = history.map(r => r.percentage)
  const totalQuestionsAttempted = history.reduce((sum, r) => sum + (r.attempted || 0), 0)
  return {
    totalExams: history.length,
    averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    highest: Math.max(...percentages),
    lowest: Math.min(...percentages),
    totalQuestionsAttempted,
  }
}

export function computeSubjectBreakdown(history) {
  const bySubject = {}
  for (const r of history) {
    const subjectName = r.exam_attempts?.exams?.subjects?.name || 'No subject'
    if (!bySubject[subjectName]) bySubject[subjectName] = []
    bySubject[subjectName].push(r.percentage)
  }
  return Object.entries(bySubject).map(([name, percentages]) => ({
    name,
    average: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    count: percentages.length,
  })).sort((a, b) => b.average - a.average)
}
