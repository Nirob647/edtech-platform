import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getExam, updateExamSettings, listExamQuestions, addQuestionToExam, removeQuestionFromExam } from '../../modules/exams/examsService'
import { listQuestions, createQuestion, updateQuestionStatus } from '../../modules/questions/questionsService'
import { listTopicsBySubject } from '../../modules/questions/topicsService'

export default function ExamEditor() {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [examQuestions, setExamQuestions] = useState([])
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const [topics, setTopics] = useState([])
  const [newQ, setNewQ] = useState({ text: '', topicId: '', explanation: '', difficulty: 'medium' })
  const emptyOptions = [
    { label: 'A', text: '', isCorrect: true },
    { label: 'B', text: '', isCorrect: false },
    { label: 'C', text: '', isCorrect: false },
    { label: 'D', text: '', isCorrect: false },
  ]
  const [newOptions, setNewOptions] = useState(emptyOptions)
  const [showAddForm, setShowAddForm] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState(new Set())

  async function refreshAll() {
    try {
      const e = await getExam(id)
      setExam(e)
      setExamQuestions(await listExamQuestions(id))
      if (e.subject_id) {
        const qs = await listQuestions({ subjectId: e.subject_id, status: 'published' })
        setAvailableQuestions(qs)
        setTopics(await listTopicsBySubject(e.subject_id))
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

  function updateNewOption(idx, field, value) {
    setNewOptions(opts => opts.map((o, i) => {
      if (field === 'isCorrect') return { ...o, isCorrect: i === idx }
      return i === idx ? { ...o, [field]: value } : o
    }))
  }

  async function handleCreateAndAttach(e) {
    e.preventDefault()
    setError('')
    if (newOptions.some(o => !o.text.trim())) { setError('Fill all 4 options'); return }
    try {
      const q = await createQuestion({
        subjectId: exam.subject_id,
        topicId: newQ.topicId || null,
        questionText: newQ.text,
        explanation: newQ.explanation,
        difficulty: newQ.difficulty,
        options: newOptions,
      })
      await addQuestionToExam(id, q.id, examQuestions.length)
      setNewQ({ text: '', topicId: newQ.topicId, explanation: '', difficulty: newQ.difficulty })
      setNewOptions(emptyOptions)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
      refreshAll()
    } catch (err) { setError(err.message) }
  }

  function toggleSelectToAdd(questionId) {
    setSelectedToAdd(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  async function handleAddSelected() {
    setError('')
    try {
      let order = examQuestions.length
      for (const qid of selectedToAdd) {
        await addQuestionToExam(id, qid, order)
        order++
      }
      setSelectedToAdd(new Set())
      refreshAll()
    } catch (err) { setError(err.message) }
  }

  async function handleTogglePublishQuestion(questionId, currentStatus) {
    try {
      await updateQuestionStatus(questionId, currentStatus === 'published' ? 'draft' : 'published')
      refreshAll()
    } catch (err) { setError(err.message) }
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
            <div>
              <span>{eq.questions?.question_text}</span>{' '}
              <span className={`seal seal-${eq.questions?.status}`} style={{ marginLeft: 6 }}>{eq.questions?.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {eq.questions?.status === 'draft'
                ? <button onClick={() => handleTogglePublishQuestion(eq.question_id, eq.questions.status)}>Publish</button>
                : <button className="btn-secondary" onClick={() => handleTogglePublishQuestion(eq.question_id, eq.questions.status)}>Unpublish</button>}
              <button className="btn-danger" onClick={() => handleRemoveQuestion(eq.question_id)}>Remove</button>
            </div>
          </div>
        ))}
        {examQuestions.length === 0 && <p className="muted">No questions attached yet.</p>}
      </div>

      {exam.subject_id && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 0 }}>Add a new question to this exam</h3>
            <button className="btn-secondary" onClick={() => setShowAddForm(s => !s)}>{showAddForm ? 'Cancel' : 'New Question'}</button>
          </div>
          {showAddForm && (
            <form onSubmit={handleCreateAndAttach} style={{ marginTop: 12 }}>
              <label className="field">Question text
                <textarea value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} required />
              </label>

              {topics.length > 0 && (
                <label className="field" style={{ width: 260 }}>Topic (optional)
                  <select value={newQ.topicId} onChange={e => setNewQ(q => ({ ...q, topicId: e.target.value }))}>
                    <option value="">-- none --</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              )}

              {newOptions.map((o, i) => (
                <label key={o.label} className={`bubble-option ${o.isCorrect ? 'selected' : ''}`}>
                  <input type="radio" name="new-correct" checked={o.isCorrect} onChange={() => updateNewOption(i, 'isCorrect', true)} />
                  <span className="bubble">{o.label}</span>
                  <input
                    placeholder={`Option ${o.label}`}
                    value={o.text}
                    onChange={e => updateNewOption(i, 'text', e.target.value)}
                    required
                    style={{ border: 'none', padding: 0, background: 'transparent', flex: 1 }}
                  />
                </label>
              ))}
              <p className="muted">Tap the bubble next to the correct answer.</p>

              <label className="field">Explanation (optional)
                <textarea value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} />
              </label>

              <label className="field" style={{ width: 160 }}>Difficulty
                <select value={newQ.difficulty} onChange={e => setNewQ(q => ({ ...q, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <p className="muted">This creates the question as Draft and attaches it here — publish it (above) once you're happy with it.</p>
              <button type="submit">Create & Attach</button>
              {justAdded && <span className="seal seal-approved" style={{ marginLeft: 10 }}>Added ✓ — add another below</span>}
            </form>
          )}
        </div>
      )}

      <div className="card">
        <h3>Add published questions from this subject</h3>
        {!exam.subject_id && <p className="muted">This exam has no subject set — create a new exam with a subject to attach questions.</p>}
        {attachable.length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted">{selectedToAdd.size} selected</span>
            <button onClick={handleAddSelected} disabled={selectedToAdd.size === 0}>Add Selected ({selectedToAdd.size})</button>
          </div>
        )}
        {attachable.map(q => (
          <label key={q.id} className="list-item" style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={selectedToAdd.has(q.id)} onChange={() => toggleSelectToAdd(q.id)} style={{ width: 'auto' }} />
              {q.question_text}
            </span>
            <button type="button" onClick={() => handleAddQuestion(q.id)}>Add</button>
          </label>
        ))}
        {exam.subject_id && attachable.length === 0 && <p className="muted">No more published questions available for this subject.</p>}
      </div>
    </div>
  )
}
