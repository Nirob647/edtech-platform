import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../modules/auth/authService'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { session, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  if (!session) return null

  return (
    <nav className="topnav">
      <Link to="/dashboard" className="brand">Exam Platform</Link>
      <div className="topnav-right">
        {isAdmin && <Link to="/admin">Admin</Link>}
        <Link to="/exams">Exams</Link>
        {profile && <span className="role-pill">{profile.role}</span>}
        <button onClick={handleLogout} className="btn-ghost" style={{ color: 'white' }}>Logout</button>
      </div>
    </nav>
  )
}
