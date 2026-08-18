import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getResultForAttempt, getExamWithQuestions, getMyAnswers } from '../../modules/exams/attemptsService'

export default function ExamResult() {
  const { examId, attemptId } = useParams()
  const [result, setResult] = useState(null)
  const [exam, setExam] = useState(null)
  const [examQuestions, setExamQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const r = await getResultForAttempt(attemptId)
        setResult(r)
        const { exam, examQuestions } = await getExamWithQuestions(examId)
        setExam(exam)
        setExamQuestions(examQuestions)
        setAnswers(await getMyAnswers(attemptId))
      } catch (err) { setError(err.message) }
    }
    load()
  }, [examId, attemptId])

  if (error) return <div className="page"><p className="error-text">{error}</p></div>
  if (!result || !exam) return <div className="page"><p>Loading…</p></div>

  const answersMap = {}
  answers.forEach(a => { answersMap[a.question_id] = a })

  return (
    <div className="page">
      <p className="back-link"><Link to="/exams">&larr; Back to exams</Link></p>
      <h1>{exam.title}</h1>
      <p className="muted">Result summary</p>

      <div className="card">
        <div className="stat-row">
          <div className="stat">
            <div className="value">{result.marks}</div>
            <div className="label">Score</div>
          </div>
          <div className="stat">
            <div className="value">{result.percentage.toFixed(1)}%</div>
            <div className="label">Percentage</div>
          </div>
          <div className="stat">
            <div className="value" style={{ color: 'var(--success)' }}>{result.correct}</div>
            <div className="label">Correct</div>
          </div>
          <div className="stat">
            <div className="value" style={{ color: 'var(--danger)' }}>{result.incorrect}</div>
            <div className="label">Incorrect</div>
          </div>
          <div className="stat">
            <div className="value">{result.unanswered}</div>
            <div className="label">Unanswered</div>
          </div>
          <div className="stat">
            <div className="value">{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</div>
            <div className="label">Time taken</div>
          </div>
        </div>
      </div>

      {exam.correct_answer_visible && examQuestions.map((eq, idx) => {
        const q = eq.questions
        const myAnswer = answersMap[q.id]
        return (
          <div key={q.id} className="card">
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <span className="question-number">{idx + 1}</span>
              <p style={{ margin: 0, paddingTop: 6 }}><strong>{q.question_text}</strong></p>
            </div>
            {q.question_options.map(o => {
              const isMine = myAnswer?.selected_option_id === o.id
              let cls = 'bubble-option'
              if (o.is_correct) cls += ' correct'
              else if (isMine) cls += ' incorrect-selected'
              return (
                <div key={o.id} className={cls}>
                  <span className="bubble">{o.option_label}</span>
                  <span>{o.option_text}</span>
                  {o.is_correct && <span className="seal seal-approved" style={{ marginLeft: 'auto' }}>Correct</span>}
                  {isMine && !o.is_correct && <span className="seal seal-archived" style={{ marginLeft: 'auto' }}>Your answer</span>}
                </div>
              )
            })}
            {q.explanation && exam.explanation_visible && (
              <p className="muted" style={{ marginTop: 8, fontStyle: 'italic' }}>{q.explanation}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
