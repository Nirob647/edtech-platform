import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAvailableExams, getMyAttempts } from '../../modules/exams/attemptsService'

export default function ExamList() {
  const [exams, setExams] = useState([])
  const [attemptsByExam, setAttemptsByExam] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const list = await listAvailableExams()
        setExams(list)
        const map = {}
        for (const ex of list) {
          map[ex.id] = await getMyAttempts(ex.id)
        }
        setAttemptsByExam(map)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/dashboard">&larr; Dashboard</Link></p>
      <h2>Available Exams</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {exams.map(ex => {
        const attempts = attemptsByExam[ex.id] || []
        const inProgress = attempts.find(a => a.status === 'in_progress')
        const submitted = attempts.find(a => a.status === 'submitted' || a.status === 'auto_submitted')
        const canRetake = ex.retake_allowed || !submitted

        return (
          <div key={ex.id} style={{ border: '1px solid #ddd', padding: 14, marginBottom: 10 }}>
            <strong>{ex.title}</strong>
            <p style={{ margin: '4px 0', color: '#666', fontSize: 13 }}>{ex.subjects?.name}</p>
            {ex.description && <p style={{ fontSize: 14 }}>{ex.description}</p>}
            <p style={{ fontSize: 13, color: '#666' }}>
              {ex.duration_enabled ? `${ex.duration_minutes} min` : 'No time limit'}
              {ex.negative_marking_enabled && ' · Negative marking'}
            </p>

            {inProgress && <Link to={`/exams/${ex.id}/take`}><button>Resume Attempt</button></Link>}
            {!inProgress && submitted && (
              <>
                <Link to={`/exams/${ex.id}/result/${submitted.id}`}><button>View Result</button></Link>
                {canRetake && <Link to={`/exams/${ex.id}/take`}><button style={{ marginLeft: 8 }}>Retake</button></Link>}
              </>
            )}
            {!inProgress && !submitted && <Link to={`/exams/${ex.id}/take`}><button>Start Exam</button></Link>}
          </div>
        )
      })}
      {exams.length === 0 && <p>No exams available right now.</p>}
    </div>
  )
}
