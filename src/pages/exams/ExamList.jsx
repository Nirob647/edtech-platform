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

  if (loading) return <div className="page"><p>Loading…</p></div>

  return (
    <div className="page">
      <h1>Exams</h1>
      {error && <p className="error-text">{error}</p>}

      {exams.map(ex => {
        const attempts = attemptsByExam[ex.id] || []
        const inProgress = attempts.find(a => a.status === 'in_progress')
        const submitted = attempts.find(a => a.status === 'submitted' || a.status === 'auto_submitted')
        const canRetake = ex.retake_allowed || !submitted

        return (
          <div key={ex.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{ex.title}</h3>
                <p className="muted">{ex.subjects?.name}</p>
              </div>
              {submitted && <span className="seal seal-published">Submitted</span>}
              {inProgress && <span className="seal seal-draft">In progress</span>}
            </div>
            {ex.description && <p>{ex.description}</p>}
            <p className="muted">
              {ex.duration_enabled ? `${ex.duration_minutes ?? '?'} min` : 'No time limit'}
              {ex.negative_marking_enabled && ' · Negative marking'}
            </p>

            <div style={{ marginTop: 10 }}>
              {inProgress && <Link to={`/exams/${ex.id}/take`}><button>Resume Attempt</button></Link>}
              {!inProgress && submitted && (
                <>
                  <Link to={`/exams/${ex.id}/result/${submitted.id}`}><button>View Result</button></Link>
                  {canRetake && <Link to={`/exams/${ex.id}/take`}><button className="btn-secondary" style={{ marginLeft: 8 }}>Retake</button></Link>}
                </>
              )}
              {!inProgress && !submitted && <Link to={`/exams/${ex.id}/take`}><button>Start Exam</button></Link>}
            </div>
          </div>
        )
      })}
      {exams.length === 0 && <div className="card"><p className="muted">No exams available right now — check back soon.</p></div>}
    </div>
  )
}
