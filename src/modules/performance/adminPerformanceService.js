import { supabase } from '../../services/database/supabaseClient'

// RLS allows admins to see every result row (is_admin() clause in results_own_or_admin_select).
export async function getAllResults() {
  const { data, error } = await supabase
    .from('results')
    .select('*, exam_attempts(id, user_id, submitted_at, exam_id, exams(title, subjects(name)), profiles(full_name, email))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function computeOverallAdminStats(allResults) {
  if (allResults.length === 0) return { totalAttempts: 0, uniqueStudents: 0, averagePercentage: 0 }
  const uniqueStudents = new Set(allResults.map(r => r.exam_attempts?.user_id)).size
  const avg = allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
  return { totalAttempts: allResults.length, uniqueStudents, averagePercentage: avg }
}

export function computeStudentAggregates(allResults) {
  const byStudent = {}
  for (const r of allResults) {
    const uid = r.exam_attempts?.user_id
    if (!uid) continue
    if (!byStudent[uid]) {
      byStudent[uid] = {
        userId: uid,
        name: r.exam_attempts.profiles?.full_name || r.exam_attempts.profiles?.email || 'Unknown',
        email: r.exam_attempts.profiles?.email || '',
        percentages: [],
        lastSubmitted: null,
      }
    }
    byStudent[uid].percentages.push(r.percentage)
    const submitted = r.exam_attempts.submitted_at
    if (submitted && (!byStudent[uid].lastSubmitted || submitted > byStudent[uid].lastSubmitted)) {
      byStudent[uid].lastSubmitted = submitted
    }
  }
  return Object.values(byStudent).map(s => ({
    ...s,
    count: s.percentages.length,
    average: s.percentages.reduce((a, b) => a + b, 0) / s.percentages.length,
  })).sort((a, b) => b.average - a.average)
}
