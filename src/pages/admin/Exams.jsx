import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listExams, createExam, deleteExam } from '../../modules/exams/examsService'
import { listSubjects } from '../../modules/questions/subjectsService'

export default function Exams() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function refresh() {
    try { setExams(await listExams()) } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    refresh()
    listSubjects().then(setSubjects).catch(e => setError(e.message))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      const exam = await createExam({ title, subjectId: subjectId || null, description })
      navigate(`/admin/exams/${exam.id}`)
    } catch (err) { setError(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this exam?')) return
    try { await deleteExam(id); refresh() } catch (err) { setError(err.message) }
  }

  return (
    <div className="page">
      <h1>Exams</h1>

      <div className="card">
        <h3>Create an exam</h3>
        <form onSubmit={handleCreate}>
          <label className="field">Title
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
          <label className="field">Subject
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">-- select subject (optional) --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">Description
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Create & Configure</button>
        </form>
      </div>

      <div className="card">
        <h3>All exams</h3>
        {exams.map(ex => (
          <div key={ex.id} className="list-item">
            <div>
              <strong>{ex.title}</strong>{' '}
              <span className={`seal seal-${ex.status}`}>{ex.status}</span>
              <p className="muted" style={{ margin: '4px 0 0' }}>{ex.subjects?.name || 'No subject'}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link to={`/admin/exams/${ex.id}`}><button className="btn-secondary">Edit</button></Link>
              <button className="btn-danger" onClick={() => handleDelete(ex.id)}>Delete</button>
            </div>
          </div>
        ))}
        {exams.length === 0 && <p className="muted">No exams yet.</p>}
      </div>
    </div>
  )
}
