import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyResultsHistory, computeOverallStats, computeSubjectBreakdown } from '../../modules/performance/performanceService'

export default function Performance() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyResultsHistory()
      .then(setHistory)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p>Loading…</p></div>
  if (error) return <div className="page"><p className="error-text">{error}</p></div>

  const stats = computeOverallStats(history)
  const bySubject = computeSubjectBreakdown(history)

  return (
    <div className="page page-wide">
      <h1>My Performance</h1>

      {history.length === 0 ? (
        <div className="card"><p className="muted">You haven't completed any exams yet. Once you submit one, your stats will show up here.</p></div>
      ) : (
        <>
          <div className="card">
            <h3>Overall</h3>
            <div className="stat-row">
              <div className="stat"><div className="value">{stats.totalExams}</div><div className="label">Exams taken</div></div>
              <div className="stat"><div className="value">{stats.averagePercentage.toFixed(1)}%</div><div className="label">Average score</div></div>
              <div className="stat"><div className="value" style={{ color: 'var(--success)' }}>{stats.highest.toFixed(1)}%</div><div className="label">Highest</div></div>
              <div className="stat"><div className="value" style={{ color: 'var(--danger)' }}>{stats.lowest.toFixed(1)}%</div><div className="label">Lowest</div></div>
              <div className="stat"><div className="value">{stats.totalQuestionsAttempted}</div><div className="label">Questions attempted</div></div>
            </div>
          </div>

          {bySubject.length > 0 && (
            <div className="card">
              <h3>By subject</h3>
              {bySubject.map(s => (
                <div key={s.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{s.name} <span className="muted">({s.count} exam{s.count > 1 ? 's' : ''})</span></span>
                    <strong>{s.average.toFixed(1)}%</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-soft)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, s.average)}%`, background: 'var(--accent)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3>Exam history</h3>
            {history.map(r => {
              const attempt = r.exam_attempts
              const exam = attempt?.exams
              return (
                <div key={r.id} className="list-item">
                  <div>
                    <strong>{exam?.title || 'Exam'}</strong>
                    <p className="muted" style={{ margin: '2px 0 0' }}>
                      {exam?.subjects?.name} · {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <strong>{r.percentage.toFixed(1)}%</strong>
                    {attempt && <Link to={`/exams/${attempt.exam_id}/result/${attempt.id}`}><button className="btn-secondary">View</button></Link>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
