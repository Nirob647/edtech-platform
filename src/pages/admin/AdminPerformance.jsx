import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllResults, computeOverallAdminStats, computeStudentAggregates } from '../../modules/performance/adminPerformanceService'

export default function AdminPerformance() {
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  useEffect(() => {
    getAllResults()
      .then(setAllResults)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><p>Loading…</p></div>
  if (error) return <div className="page"><p className="error-text">{error}</p></div>

  const overall = computeOverallAdminStats(allResults)
  const students = computeStudentAggregates(allResults)
  const selectedStudent = students.find(s => s.userId === selectedStudentId)
  const selectedHistory = selectedStudentId
    ? allResults.filter(r => r.exam_attempts?.user_id === selectedStudentId)
    : []

  return (
    <div className="page page-wide">
      <h1>Student Performance</h1>

      <div className="card">
        <h3>Overall</h3>
        <div className="stat-row">
          <div className="stat"><div className="value">{overall.uniqueStudents}</div><div className="label">Students with results</div></div>
          <div className="stat"><div className="value">{overall.totalAttempts}</div><div className="label">Total attempts</div></div>
          <div className="stat"><div className="value">{overall.averagePercentage.toFixed(1)}%</div><div className="label">Average score</div></div>
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="card">
          <h3>By student</h3>
          {students.length === 0 && <p className="muted">No completed exams yet.</p>}
          {students.map(s => (
            <div key={s.userId} className="list-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedStudentId(s.userId)}>
              <div>
                <strong>{s.name}</strong>
                <p className="muted" style={{ margin: '2px 0 0' }}>{s.email} · {s.count} exam{s.count > 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>{s.average.toFixed(1)}%</strong>
                <button className="btn-secondary">View</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <button className="btn-secondary" onClick={() => setSelectedStudentId(null)} style={{ marginBottom: 14 }}>&larr; All students</button>
          <h3>{selectedStudent?.name}</h3>
          <p className="muted">{selectedStudent?.email}</p>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <div className="stat"><div className="value">{selectedStudent?.count}</div><div className="label">Exams taken</div></div>
            <div className="stat"><div className="value">{selectedStudent?.average.toFixed(1)}%</div><div className="label">Average</div></div>
          </div>
          {selectedHistory.map(r => {
            const attempt = r.exam_attempts
            return (
              <div key={r.id} className="list-item">
                <div>
                  <strong>{attempt?.exams?.title}</strong>
                  <p className="muted" style={{ margin: '2px 0 0' }}>
                    {attempt?.exams?.subjects?.name} · {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <strong>{r.percentage.toFixed(1)}%</strong>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
