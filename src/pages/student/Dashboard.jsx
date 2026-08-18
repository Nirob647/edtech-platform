import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { profile, loading, isAdmin } = useAuth()

  if (loading) return <div className="page"><p>Loading…</p></div>

  return (
    <div className="page">
      <h1>Welcome{profile ? `, ${profile.full_name || profile.email}` : ''}</h1>
      <p className="muted">You're signed in as <strong>{profile?.role}</strong></p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Exams</h3>
        <p>See what's available, resume an attempt in progress, or review a past result.</p>
        <Link to="/exams"><button>View Exams</button></Link>
      </div>

      {isAdmin && (
        <div className="card">
          <h3>Admin</h3>
          <p>Manage subjects, the question bank, and exams.</p>
          <Link to="/admin"><button className="btn-secondary">Go to Admin Panel</button></Link>
        </div>
      )}
    </div>
  )
}
