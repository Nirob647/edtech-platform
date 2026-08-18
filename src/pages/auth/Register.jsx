import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../modules/auth/authService'

export default function Register() {
  const [fullName, setFullName] = useState('')
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
      await signUp({ email, password, fullName })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-narrow" style={{ paddingTop: '12vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="question-number" style={{ width: 44, height: 44, fontSize: '1rem', marginRight: 0 }}>Q1</span>
        <h1 style={{ marginTop: 14 }}>Create your account</h1>
        <p className="muted">Register to start taking exams</p>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <label className="field">Full name
            <input placeholder="Your name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </label>
          <label className="field">Email
            <input placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="field">Password
            <input placeholder="At least 6 characters" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
      </div>
      <p style={{ textAlign: 'center' }} className="muted">Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  )
}
