import { supabase } from '../../services/database/supabaseClient'

export async function listQuestions({ subjectId, topicId, status } = {}) {
  let query = supabase
    .from('questions')
    .select('*, question_options(*)')
    .order('created_at', { ascending: false })

  if (subjectId) query = query.eq('subject_id', subjectId)
  if (topicId) query = query.eq('topic_id', topicId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createQuestion({ subjectId, topicId, questionText, explanation, difficulty, options }) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .insert({
      subject_id: subjectId,
      topic_id: topicId || null,
      question_text: questionText,
      explanation,
      difficulty,
      status: 'draft',
      source_type: 'manual',
      created_by: user.id,
    })
    .select()
    .single()
  if (qErr) throw qErr

  const optionRows = options.map(o => ({
    question_id: question.id,
    option_label: o.label,
    option_text: o.text,
    is_correct: o.isCorrect,
  }))
  const { error: oErr } = await supabase.from('question_options').insert(optionRows)
  if (oErr) throw oErr

  return question
}

export async function updateQuestionStatus(id, status) {
  const { error } = await supabase
    .from('questions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}
