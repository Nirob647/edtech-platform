import { useEffect, useState } from 'react'
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../../modules/questions/subjectsService'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    setLoading(true)
    try { setSubjects(await listSubjects()) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) await updateSubject(editingId, { name, description })
      else await createSubject({ name, description })
      setName(''); setDescription(''); setEditingId(null)
      refresh()
    } catch (err) { setError(err.message) }
  }

  function startEdit(s) {
    setEditingId(s.id)
    setName(s.name)
    setDescription(s.description || '')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this subject? This may fail if questions/exams reference it.')) return
    try { await deleteSubject(id); refresh() }
    catch (err) { setError(err.message) }
  }

  return (
    <div className="page">
      <h1>Subjects</h1>

      <div className="card">
        <h3>{editingId ? 'Edit subject' : 'Add a subject'}</h3>
        <form onSubmit={handleSubmit}>
          <label className="field">Name
            <input placeholder="e.g. Contract Law" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="field">Description
            <textarea placeholder="Optional" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">{editingId ? 'Update' : 'Create'} Subject</button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setName(''); setDescription('') }} style={{ marginLeft: 8 }}>Cancel</button>}
        </form>
      </div>

      {loading ? <p className="muted">Loading…</p> : (
        <div className="card">
          {subjects.map(s => (
            <div key={s.id} className="list-item">
              <div>
                <strong>{s.name}</strong>
                {s.description && <p className="muted" style={{ margin: '4px 0 0' }}>{s.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
              </div>
            </div>
          ))}
          {subjects.length === 0 && <p className="muted">No subjects yet — add one above.</p>}
        </div>
      )}
    </div>
  )
}
