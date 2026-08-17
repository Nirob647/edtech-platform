import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getExamWithQuestions, getMyAttempts, startAttempt, getMyAnswers,
  saveAnswer, submitAttempt, autoSubmitExpired,
} from '../../modules/exams/attemptsService'

export default function TakeExam() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [examQuestions, setExamQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({}) // questionId -> optionId
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    async function init() {
      try {
        const { exam, examQuestions } = await getExamWithQuestions(examId)
        setExam(exam)
        setExamQuestions(examQuestions)

        const myAttempts = await getMyAttempts(examId)
        let current = myAttempts.find(a => a.status === 'in_progress')

        // If we found an in-progress attempt but its timer already expired
        // (e.g. from a previous short-duration test), auto-submit it and
        // start a fresh attempt instead of getting stuck redirecting forever.
        if (current && current.expires_at && new Date(current.expires_at) <= new Date()) {
          try {
            const staleAnswers = await getMyAnswers(current.id)
            const staleMap = {}
            staleAnswers.forEach(a => { staleMap[a.question_id] = a.selected_option_id })
            await autoSubmitExpired(current.id, exam, examQuestions, staleMap)
          } catch (e) {
            // even if grading the stale attempt fails, don't block a fresh start
          }
          current = null
        }

        if (!current) {
          current = await startAttempt(exam)
        }
        setAttempt(current)

        const existingAnswers = await getMyAnswers(current.id)
        const map = {}
        existingAnswers.forEach(a => { map[a.question_id] = a.selected_option_id })
        setAnswers(map)
      } catch (err) {
        setError(err.message)
      }
    }
    init()
  }, [examId])

  // Server-tracked countdown: recalculated from expires_at, survives refresh
  useEffect(() => {
    if (!attempt?.expires_at) return
    function tick() {
      const remaining = Math.max(0, Math.floor((new Date(attempt.expires_at) - new Date()) / 1000))
      setRemainingSeconds(remaining)
      if (remaining <= 0 && !submittedRef.current) {
        handleAutoSubmit()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [attempt])

  async function handleSelect(questionId, optionId) {
    if (exam.answer_change_allowed === false && answers[questionId]) return
    setAnswers(a => ({ ...a, [questionId]: optionId }))
    try { await saveAnswer(attempt.id, questionId, optionId) }
    catch (err) { setError(err.message) }
  }

  async function handleAutoSubmit() {
    if (submittedRef.current) return
    submittedRef.current = true
    try {
      await autoSubmitExpired(attempt.id, exam, examQuestions, answers)
      navigate(`/exams/${examId}/result/${attempt.id}`)
    } catch (err) { setError(err.message) }
  }

  async function handleSubmit() {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      await submitAttempt(attempt.id, exam, examQuestions, answers)
      navigate(`/exams/${examId}/result/${attempt.id}`)
    } catch (err) {
      setError(err.message)
      submittedRef.current = false
      setSubmitting(false)
    }
  }

  if (error) return <p style={{ color: 'red', maxWidth: 700, margin: '40px auto' }}>{error}</p>
  if (!exam || !attempt) return <p>Loading...</p>

  const answeredCount = Object.keys(answers).length

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/exams">&larr; Exams</Link></p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{exam.title}</h2>
        {remainingSeconds !== null && (
          <div style={{ fontWeight: 'bold', color: remainingSeconds < 60 ? 'red' : 'inherit' }}>
            {formatTime(remainingSeconds)}
          </div>
        )}
      </div>
      <p>{answeredCount} / {examQuestions.length} answered</p>

      {examQuestions.map((eq, idx) => {
        const q = eq.questions
        return (
          <div key={q.id} style={{ border: '1px solid #ddd', padding: 14, marginBottom: 12 }}>
            <p><strong>Q{idx + 1}.</strong> {q.question_text}</p>
            {q.question_options.map(o => (
              <label key={o.id} style={{ display: 'block', padding: '4px 0' }}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === o.id}
                  onChange={() => handleSelect(q.id, o.id)}
                  disabled={exam.answer_change_allowed === false && !!answers[q.id] && answers[q.id] !== o.id}
                  style={{ marginRight: 8 }}
                />
                {o.option_label}. {o.option_text}
              </label>
            ))}
          </div>
        )
      })}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px' }}>
        {submitting ? 'Submitting...' : 'Submit Exam'}
      </button>
    </div>
  )
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
