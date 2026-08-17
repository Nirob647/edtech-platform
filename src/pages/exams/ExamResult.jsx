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

  if (error) return <p style={{ color: 'red', maxWidth: 700, margin: '40px auto' }}>{error}</p>
  if (!result || !exam) return <p>Loading...</p>

  const answersMap = {}
  answers.forEach(a => { answersMap[a.question_id] = a })

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/exams">&larr; Exams</Link></p>
      <h2>Result: {exam.title}</h2>

      <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 20 }}>
        <p><strong>Score:</strong> {result.marks} ({result.percentage.toFixed(1)}%)</p>
        <p>Total: {result.total_questions} · Attempted: {result.attempted} · Correct: {result.correct} · Incorrect: {result.incorrect} · Unanswered: {result.unanswered}</p>
        <p>Time taken: {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</p>
      </div>

      {exam.correct_answer_visible && examQuestions.map((eq, idx) => {
        const q = eq.questions
        const myAnswer = answersMap[q.id]
        return (
          <div key={q.id} style={{ border: '1px solid #ddd', padding: 14, marginBottom: 10 }}>
            <p><strong>Q{idx + 1}.</strong> {q.question_text}</p>
            {q.question_options.map(o => {
              const isMine = myAnswer?.selected_option_id === o.id
              const color = o.is_correct ? 'green' : (isMine ? 'red' : 'inherit')
              return (
                <p key={o.id} style={{ color, margin: '2px 0' }}>
                  {o.option_label}. {o.option_text} {o.is_correct && '✓ Correct'} {isMine && !o.is_correct && '(Your answer)'}
                </p>
              )
            })}
            {q.explanation && exam.explanation_visible && <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}><em>{q.explanation}</em></p>}
          </div>
        )
      })}
    </div>
  )
}
