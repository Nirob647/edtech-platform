import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const [answers, setAnswers] = useState({})
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

        if (current && current.expires_at && new Date(current.expires_at) <= new Date()) {
          try {
            const staleAnswers = await getMyAnswers(current.id)
            const staleMap = {}
            staleAnswers.forEach(a => { staleMap[a.question_id] = a.selected_option_id })
            await autoSubmitExpired(current.id, exam, examQuestions, staleMap)
          } catch (e) { /* proceed to fresh attempt regardless */ }
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

  if (error) return <div className="page"><p className="error-text">{error}</p></div>
  if (!exam || !attempt) return <div className="page"><p>Loading…</p></div>

  const answeredCount = Object.keys(answers).length
  const lowTime = remainingSeconds !== null && remainingSeconds < 60

  return (
    <div className="page">
      <div style={{ position: 'sticky', top: 0, background: 'var(--paper)', paddingBottom: 14, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>{exam.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{answeredCount} / {examQuestions.length} answered</p>
          </div>
          {remainingSeconds !== null && (
            <div className={`exam-clock ${lowTime ? 'low-time' : ''}`}>{formatTime(remainingSeconds)}</div>
          )}
        </div>
      </div>

      {examQuestions.map((eq, idx) => {
        const q = eq.questions
        const selected = answers[q.id]
        return (
          <div key={q.id} className="card">
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <span className="question-number">{idx + 1}</span>
              <p style={{ margin: 0, paddingTop: 6 }}><strong>{q.question_text}</strong></p>
            </div>
            {q.question_options.map(o => (
              <label
                key={o.id}
                className={`bubble-option ${selected === o.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={selected === o.id}
                  onChange={() => handleSelect(q.id, o.id)}
                  disabled={exam.answer_change_allowed === false && !!selected && selected !== o.id}
                />
                <span className="bubble">{o.option_label}</span>
                <span>{o.option_text}</span>
              </label>
            ))}
          </div>
        )
      })}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 24px', fontSize: '1rem' }}>
        {submitting ? 'Submitting…' : 'Submit Exam'}
      </button>
    </div>
  )
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
