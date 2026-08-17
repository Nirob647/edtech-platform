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
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/admin">&larr; Admin Dashboard</Link></p>
      <h2>Exams</h2>

      <form onSubmit={handleCreate} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
        <h3>Create Exam</h3>
        <input placeholder="Exam title" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} style={inputStyle}>
          <option value="">-- select subject (optional) --</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Create & Configure</button>
      </form>

      <h3>All Exams</h3>
      {exams.map(ex => (
        <div key={ex.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{ex.title}</strong>{' '}
            <span style={{ fontSize: 12, color: ex.status === 'published' ? 'green' : '#999' }}>[{ex.status}]</span>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>{ex.subjects?.name || 'No subject'}</p>
          </div>
          <div>
            <Link to={`/admin/exams/${ex.id}`}><button>Edit</button></Link>
            <button onClick={() => handleDelete(ex.id)} style={{ marginLeft: 8 }}>Delete</button>
          </div>
        </div>
      ))}
      {exams.length === 0 && <p>No exams yet.</p>}
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: 8, marginBottom: 10 }
