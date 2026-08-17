import { useEffect, useState } from 'react'
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../../modules/questions/subjectsService'
import { Link } from 'react-router-dom'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    setLoading(true)
    try {
      setSubjects(await listSubjects())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateSubject(editingId, { name, description })
      } else {
        await createSubject({ name, description })
      }
      setName(''); setDescription(''); setEditingId(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(s) {
    setEditingId(s.id)
    setName(s.name)
    setDescription(s.description || '')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this subject? This may fail if questions/exams reference it.')) return
    try {
      await deleteSubject(id)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/admin">&larr; Admin Dashboard</Link></p>
      <h2>Subjects</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, border: '1px solid #ccc', padding: 16 }}>
        <input placeholder="Subject name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">{editingId ? 'Update' : 'Create'} Subject</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setDescription('') }} style={{ marginLeft: 8 }}>Cancel</button>}
      </form>

      {loading ? <p>Loading...</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {subjects.map(s => (
            <li key={s.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{s.name}</strong>
                {s.description && <p style={{ margin: '4px 0 0', color: '#666' }}>{s.description}</p>}
              </div>
              <div>
                <button onClick={() => startEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ marginLeft: 8 }}>Delete</button>
              </div>
            </li>
          ))}
          {subjects.length === 0 && <p>No subjects yet. Create one above.</p>}
        </ul>
      )}
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: 8, marginBottom: 10 }
