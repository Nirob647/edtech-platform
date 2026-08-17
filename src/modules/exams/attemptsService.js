import { supabase } from '../../services/database/supabaseClient'

// Exams visible to the current student (RLS already filters to published+accessible)
export async function listAvailableExams() {
  const { data, error } = await supabase
    .from('exams')
    .select('*, subjects(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getExamWithQuestions(examId) {
  const { data: exam, error: examErr } = await supabase.from('exams').select('*, subjects(name)').eq('id', examId).single()
  if (examErr) throw examErr

  const { data: eqs, error: eqErr } = await supabase
    .from('exam_questions')
    .select('order_index, marks, questions(id, question_text, explanation, question_options(*))')
    .eq('exam_id', examId)
    .order('order_index')
  if (eqErr) throw eqErr

  return { exam, examQuestions: eqs }
}

export async function getMyAttempts(examId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function startAttempt(exam) {
  const { data: { user } } = await supabase.auth.getUser()
  const startedAt = new Date()
  const expiresAt = exam.duration_enabled && exam.duration_minutes
    ? new Date(startedAt.getTime() + exam.duration_minutes * 60000)
    : null

  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: exam.id,
      user_id: user.id,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      status: 'in_progress',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAttempt(attemptId) {
  const { data, error } = await supabase.from('exam_attempts').select('*').eq('id', attemptId).single()
  if (error) throw error
  return data
}

export async function getMyAnswers(attemptId) {
  const { data, error } = await supabase.from('attempt_answers').select('*').eq('attempt_id', attemptId)
  if (error) throw error
  return data
}

export async function saveAnswer(attemptId, questionId, selectedOptionId) {
  const { error } = await supabase
    .from('attempt_answers')
    .upsert(
      { attempt_id: attemptId, question_id: questionId, selected_option_id: selectedOptionId, answered_at: new Date().toISOString() },
      { onConflict: 'attempt_id,question_id' }
    )
  if (error) throw error
}

export async function submitAttempt(attemptId, exam, examQuestions, answersMap) {
  let correct = 0, incorrect = 0, unanswered = 0
  let marks = 0

  for (const eq of examQuestions) {
    const q = eq.questions
    const selectedOptionId = answersMap[q.id]
    const correctOption = q.question_options.find(o => o.is_correct)

    if (!selectedOptionId) {
      unanswered++
      continue
    }
    const isCorrect = selectedOptionId === correctOption?.id
    if (isCorrect) {
      correct++
      marks += Number(eq.marks || 1)
    } else {
      incorrect++
      if (exam.negative_marking_enabled) {
        marks -= Number(exam.negative_mark_value || 0)
      }
    }

    await supabase
      .from('attempt_answers')
      .update({
        correct_option_id: correctOption?.id || null,
        is_correct: isCorrect,
        marks_awarded: isCorrect ? Number(eq.marks || 1) : (exam.negative_marking_enabled ? -Number(exam.negative_mark_value || 0) : 0),
      })
      .eq('attempt_id', attemptId)
      .eq('question_id', q.id)
  }

  const total = examQuestions.length
  const attempted = correct + incorrect
  const percentage = total > 0 ? (correct / total) * 100 : 0
  const submittedAt = new Date()

  const attempt = await getAttempt(attemptId)
  const startedAt = new Date(attempt.started_at)
  const timeTakenSeconds = Math.round((submittedAt - startedAt) / 1000)

  const { error: attErr } = await supabase
    .from('exam_attempts')
    .update({
      submitted_at: submittedAt.toISOString(),
      status: 'submitted',
      score: marks,
      percentage,
    })
    .eq('id', attemptId)
  if (attErr) throw attErr

  const { data: result, error: resErr } = await supabase
    .from('results')
    .insert({
      attempt_id: attemptId,
      total_questions: total,
      attempted,
      correct,
      incorrect,
      unanswered,
      marks,
      percentage,
      time_taken_seconds: timeTakenSeconds,
    })
    .select()
    .single()
  if (resErr) throw resErr

  return result
}

export async function autoSubmitExpired(attemptId, exam, examQuestions, answersMap) {
  const result = await submitAttempt(attemptId, exam, examQuestions, answersMap)
  await supabase.from('exam_attempts').update({ status: 'auto_submitted' }).eq('id', attemptId)
  return result
}

export async function getResultForAttempt(attemptId) {
  const { data, error } = await supabase.from('results').select('*').eq('attempt_id', attemptId).single()
  if (error) throw error
  return data
}
