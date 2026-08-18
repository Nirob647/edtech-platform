import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../../modules/auth/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-narrow" style={{ paddingTop: '15vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="question-number" style={{ width: 44, height: 44, fontSize: '1rem', marginRight: 0 }}>Q1</span>
        <h1 style={{ marginTop: 14 }}>Welcome back</h1>
        <p className="muted">Sign in to continue your exams</p>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <label className="field">Email
            <input placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="field">Password
            <input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <p style={{ textAlign: 'center' }} className="muted">No account? <Link to="/register">Register</Link></p>
    </div>
  )
}
