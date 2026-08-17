import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../modules/auth/authService'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { profile, loading, isAdmin } = useAuth()
  const navigate = useNavigate()

  if (loading) return <p>Loading...</p>

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Welcome{profile ? `, ${profile.full_name || profile.email}` : ''}</h2>
      <p>Role: {profile?.role}</p>
      {isAdmin && <p>You are an admin. Admin panel coming next.</p>}
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
