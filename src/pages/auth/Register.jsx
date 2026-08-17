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
    <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Create account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Creating...' : 'Register'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: 8, marginBottom: 10 }
const buttonStyle = { width: '100%', padding: 10 }
