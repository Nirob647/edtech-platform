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

// Bulk import from parsed CSV rows. Expected keys (case-insensitive, from header row):
// question, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation, difficulty
export async function bulkImportQuestions({ subjectId, topicId, rows }) {
  const results = { created: 0, failed: [] }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    try {
      const questionText = r.question
      const optA = r.option_a
      const optB = r.option_b
      const optC = r.option_c
      const optD = r.option_d
      const correctLetter = (r.correct_answer || '').trim().toUpperCase()

      if (!questionText || !optA || !optB || !optC || !optD) {
        throw new Error('Missing required field (question or one of the 4 options)')
      }
      if (!['A', 'B', 'C', 'D'].includes(correctLetter)) {
        throw new Error(`correct_answer must be A, B, C, or D (got "${r.correct_answer}")`)
      }

      const options = [
        { label: 'A', text: optA, isCorrect: correctLetter === 'A' },
        { label: 'B', text: optB, isCorrect: correctLetter === 'B' },
        { label: 'C', text: optC, isCorrect: correctLetter === 'C' },
        { label: 'D', text: optD, isCorrect: correctLetter === 'D' },
      ]

      await createQuestion({
        subjectId,
        topicId: topicId || null,
        questionText,
        explanation: r.explanation || '',
        difficulty: ['easy', 'medium', 'hard'].includes((r.difficulty || '').toLowerCase()) ? r.difficulty.toLowerCase() : 'medium',
        options,
      })
      results.created++
    } catch (err) {
      results.failed.push({ row: i + 2, reason: err.message }) // +2: header row + 1-indexed
    }
  }
  return results
}
