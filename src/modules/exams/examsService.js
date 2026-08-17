import { supabase } from '../../services/database/supabaseClient'

export async function listExams() {
  const { data, error } = await supabase
    .from('exams')
    .select('*, subjects(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getExam(id) {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createExam({ title, subjectId, description }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('exams')
    .insert({ title, subject_id: subjectId, description, created_by: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExamSettings(id, settings) {
  const { data, error } = await supabase
    .from('exams')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) throw error
}

// ---- exam_questions ----
export async function listExamQuestions(examId) {
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*, questions(id, question_text, status, difficulty)')
    .eq('exam_id', examId)
    .order('order_index')
  if (error) throw error
  return data
}

export async function addQuestionToExam(examId, questionId, orderIndex) {
  const { error } = await supabase
    .from('exam_questions')
    .insert({ exam_id: examId, question_id: questionId, order_index: orderIndex, marks: 1 })
  if (error) throw error
}

export async function removeQuestionFromExam(examId, questionId) {
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('exam_id', examId)
    .eq('question_id', questionId)
  if (error) throw error
}
