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
    try {
      await addQuestionToExam(id, questionId, examQuestions.length)
      refreshAll()
    } catch (err) { setError(err.message) }
  }

  async function handleRemoveQuestion(questionId) {
    try {
      await removeQuestionFromExam(id, questionId)
      refreshAll()
    } catch (err) { setError(err.message) }
  }

  async function handlePublish() {
    if (examQuestions.length === 0) { setError('Add at least one question before publishing.'); return }
    try {
      await updateExamSettings(id, { status: 'published' })
      refreshAll()
    } catch (err) { setError(err.message) }
  }

  async function handleUnpublish() {
    try { await updateExamSettings(id, { status: 'draft' }); refreshAll() }
    catch (err) { setError(err.message) }
  }

  if (!exam) return <p>Loading...</p>

  const attachedIds = new Set(examQuestions.map(eq => eq.question_id))
  const attachable = availableQuestions.filter(q => !attachedIds.has(q.id))

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/admin/exams">&larr; All Exams</Link></p>
      <h2>{exam.title} <span style={{ fontSize: 14, color: exam.status === 'published' ? 'green' : '#999' }}>[{exam.status}]</span></h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 16 }}>
        {exam.status === 'draft'
          ? <button onClick={handlePublish}>Publish Exam</button>
          : <button onClick={handleUnpublish}>Unpublish</button>}
      </div>

      <form onSubmit={handleSaveSettings} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
        <h3>Settings</h3>

        <label>Duration (minutes): </label>
        <input type="number" value={exam.duration_minutes || ''} onChange={e => updateField('duration_minutes', Number(e.target.value))} style={{ width: 80, marginBottom: 10 }} />

        <div><label><input type="checkbox" checked={exam.duration_enabled} onChange={e => updateField('duration_enabled', e.target.checked)} /> Timer enabled</label></div>
        <div><label><input type="checkbox" checked={exam.answer_change_allowed} onChange={e => updateField('answer_change_allowed', e.target.checked)} /> Allow changing answers</label></div>
        <div><label><input type="checkbox" checked={exam.result_visible} onChange={e => updateField('result_visible', e.target.checked)} /> Show result after submission</label></div>
        <div><label><input type="checkbox" checked={exam.correct_answer_visible} onChange={e => updateField('correct_answer_visible', e.target.checked)} /> Show correct answers after submission</label></div>
        <div><label><input type="checkbox" checked={exam.retake_allowed} onChange={e => updateField('retake_allowed', e.target.checked)} /> Allow retake</label></div>
        <div><label><input type="checkbox" checked={exam.randomize_questions} onChange={e => updateField('randomize_questions', e.target.checked)} /> Randomize question order</label></div>
        <div><label><input type="checkbox" checked={exam.negative_marking_enabled} onChange={e => updateField('negative_marking_enabled', e.target.checked)} /> Negative marking</label></div>
        {exam.negative_marking_enabled && (
          <div>Negative mark value: <input type="number" step="0.1" value={exam.negative_mark_value || 0} onChange={e => updateField('negative_mark_value', Number(e.target.value))} style={{ width: 60 }} /></div>
        )}

        <label style={{ display: 'block', marginTop: 10 }}>Access type: </label>
        <select value={exam.access_type} onChange={e => updateField('access_type', e.target.value)}>
          <option value="public">Public (all students)</option>
          <option value="private">Private (assigned only)</option>
        </select>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Save Settings</button>
          {saved && <span style={{ marginLeft: 10, color: 'green' }}>Saved ✓</span>}
        </div>
      </form>

      <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
        <h3>Questions in this exam ({examQuestions.length})</h3>
        {examQuestions.map(eq => (
          <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span>{eq.questions?.question_text}</span>
            <button onClick={() => handleRemoveQuestion(eq.question_id)}>Remove</button>
          </div>
        ))}
        {examQuestions.length === 0 && <p>No questions attached yet.</p>}
      </div>

      <div style={{ border: '1px solid #ccc', padding: 16 }}>
        <h3>Add published questions from this subject</h3>
        {!exam.subject_id && <p>Set a subject on this exam first (recreate exam with a subject, or we'll add subject-editing later).</p>}
        {attachable.map(q => (
          <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span>{q.question_text}</span>
            <button onClick={() => handleAddQuestion(q.id)}>Add</button>
          </div>
        ))}
        {exam.subject_id && attachable.length === 0 && <p>No more published questions available for this subject.</p>}
      </div>
    </div>
  )
}
