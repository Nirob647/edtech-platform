import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getExam, updateExamSettings, listExamQuestions, addQuestionToExam, removeQuestionFromExam } from '../../modules/exams/examsService'
import { listQuestions } from '../../modules/questions/questionsService'

export default function ExamEditor() {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [examQuestions, setExamQuestions] = useState([])
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function refreshAll() {
    try {
      const e = await getExam(id)
      setExam(e)
      setExamQuestions(await listExamQuestions(id))
      if (e.subject_id) {
        const qs = await listQuestions({ subjectId: e.subject_id, status: 'published' })
        setAvailableQuestions(qs)
      }
    } catch (err) { setError(err.message) }
  }

  useEffect(() => { refreshAll() }, [id])

  function updateField(field, value) {
    setExam(ex => ({ ...ex, [field]: value }))
    setSaved(false)
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setError('')
    try {
      const { id: _id, created_at, updated_at, subjects, ...settings } = exam
      await updateExamSettings(id, settings)
      setSaved(true)
    } catch (err) { setError(err.message) }
  }

  async function handleAddQuestion(questionId) {
    try { await addQuestionToExam(id, questionId, examQuestions.length); refreshAll() }
    catch (err) { setError(err.message) }
  }

  async function handleRemoveQuestion(questionId) {
    try { await removeQuestionFromExam(id, questionId); refreshAll() }
    catch (err) { setError(err.message) }
  }

  async function handlePublish() {
    if (examQuestions.length === 0) { setError('Add at least one question before publishing.'); return }
    try { await updateExamSettings(id, { status: 'published' }); refreshAll() }
    catch (err) { setError(err.message) }
  }

  async function handleUnpublish() {
    try { await updateExamSettings(id, { status: 'draft' }); refreshAll() }
    catch (err) { setError(err.message) }
  }

  if (!exam) return <div className="page"><p>Loading…</p></div>

  const attachedIds = new Set(examQuestions.map(eq => eq.question_id))
  const attachable = availableQuestions.filter(q => !attachedIds.has(q.id))

  return (
    <div className="page page-wide">
      <p className="back-link"><Link to="/admin/exams">&larr; All exams</Link></p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ marginBottom: 0 }}>{exam.title}</h1>
        <span className={`seal seal-${exam.status}`}>{exam.status}</span>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ margin: '16px 0' }}>
        {exam.status === 'draft'
          ? <button onClick={handlePublish}>Publish Exam</button>
          : <button className="btn-secondary" onClick={handleUnpublish}>Unpublish</button>}
      </div>

      <div className="card">
        <h3>Settings</h3>
        <form onSubmit={handleSaveSettings}>
          <label className="field" style={{ width: 140 }}>Duration (minutes)
            <input type="number" value={exam.duration_minutes || ''} onChange={e => updateField('duration_minutes', Number(e.target.value))} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', margin: '10px 0' }}>
            <label><input type="checkbox" checked={exam.duration_enabled} onChange={e => updateField('duration_enabled', e.target.checked)} /> Timer enabled</label>
            <label><input type="checkbox" checked={exam.answer_change_allowed} onChange={e => updateField('answer_change_allowed', e.target.checked)} /> Allow changing answers</label>
            <label><input type="checkbox" checked={exam.result_visible} onChange={e => updateField('result_visible', e.target.checked)} /> Show result after submission</label>
            <label><input type="checkbox" checked={exam.correct_answer_visible} onChange={e => updateField('correct_answer_visible', e.target.checked)} /> Show correct answers</label>
            <label><input type="checkbox" checked={exam.retake_allowed} onChange={e => updateField('retake_allowed', e.target.checked)} /> Allow retake</label>
            <label><input type="checkbox" checked={exam.randomize_questions} onChange={e => updateField('randomize_questions', e.target.checked)} /> Randomize question order</label>
            <label><input type="checkbox" checked={exam.negative_marking_enabled} onChange={e => updateField('negative_marking_enabled', e.target.checked)} /> Negative marking</label>
          </div>

          {exam.negative_marking_enabled && (
            <label className="field" style={{ width: 140 }}>Negative mark value
              <input type="number" step="0.1" value={exam.negative_mark_value || 0} onChange={e => updateField('negative_mark_value', Number(e.target.value))} />
            </label>
          )}

          <label className="field" style={{ width: 260 }}>Access
            <select value={exam.access_type} onChange={e => updateField('access_type', e.target.value)}>
              <option value="public">Public (all students)</option>
              <option value="private">Private (assigned only)</option>
            </select>
          </label>

          <div style={{ marginTop: 4 }}>
            <button type="submit">Save Settings</button>
            {saved && <span className="seal seal-approved" style={{ marginLeft: 10 }}>Saved</span>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Questions in this exam ({examQuestions.length})</h3>
        {examQuestions.map(eq => (
          <div key={eq.id} className="list-item">
            <span>{eq.questions?.question_text}</span>
            <button className="btn-danger" onClick={() => handleRemoveQuestion(eq.question_id)}>Remove</button>
          </div>
        ))}
        {examQuestions.length === 0 && <p className="muted">No questions attached yet.</p>}
      </div>

      <div className="card">
        <h3>Add published questions from this subject</h3>
        {!exam.subject_id && <p className="muted">This exam has no subject set — create a new exam with a subject to attach questions.</p>}
        {attachable.map(q => (
          <div key={q.id} className="list-item">
            <span>{q.question_text}</span>
            <button onClick={() => handleAddQuestion(q.id)}>Add</button>
          </div>
        ))}
        {exam.subject_id && attachable.length === 0 && <p className="muted">No more published questions available for this subject.</p>}
      </div>
    </div>
  )
}
