import { useEffect, useState } from 'react'
import { listSubjects } from '../../modules/questions/subjectsService'
import { listTopicsBySubject, createTopic } from '../../modules/questions/topicsService'
import { listQuestions, createQuestion, updateQuestionStatus, deleteQuestion, bulkImportQuestions } from '../../modules/questions/questionsService'
import { parseCSV, downloadCSVTemplate } from '../../utils/csv'

const emptyOptions = [
  { label: 'A', text: '', isCorrect: true },
  { label: 'B', text: '', isCorrect: false },
  { label: 'C', text: '', isCorrect: false },
  { label: 'D', text: '', isCorrect: false },
]

export default function QuestionBank() {
  const [subjects, setSubjects] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [topics, setTopics] = useState([])
  const [topicId, setTopicId] = useState('')
  const [newTopicName, setNewTopicName] = useState('')

  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')

  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [options, setOptions] = useState(emptyOptions)

  const [importSummary, setImportSummary] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { listSubjects().then(setSubjects).catch(e => setError(e.message)) }, [])

  useEffect(() => {
    if (!subjectId) { setTopics([]); setTopicId(''); setQuestions([]); return }
    listTopicsBySubject(subjectId).then(setTopics).catch(e => setError(e.message))
    refreshQuestions()
  }, [subjectId])

  useEffect(() => { if (subjectId) refreshQuestions() }, [topicId])

  async function refreshQuestions() {
    try { setQuestions(await listQuestions({ subjectId, topicId: topicId || undefined })) }
    catch (e) { setError(e.message) }
  }

  async function handleAddTopic(e) {
    e.preventDefault()
    if (!newTopicName.trim()) return
    try {
      await createTopic({ subjectId, name: newTopicName })
      setNewTopicName('')
      setTopics(await listTopicsBySubject(subjectId))
    } catch (err) { setError(err.message) }
  }

  function updateOption(idx, field, value) {
    setOptions(opts => opts.map((o, i) => {
      if (field === 'isCorrect') return { ...o, isCorrect: i === idx }
      return i === idx ? { ...o, [field]: value } : o
    }))
  }

  async function handleAddQuestion(e) {
    e.preventDefault()
    setError('')
    if (!subjectId) { setError('Select a subject first'); return }
    if (options.some(o => !o.text.trim())) { setError('Fill all 4 options'); return }
    try {
      await createQuestion({ subjectId, topicId: topicId || null, questionText, explanation, difficulty, options })
      setQuestionText(''); setExplanation(''); setDifficulty('medium'); setOptions(emptyOptions)
      refreshQuestions()
    } catch (err) { setError(err.message) }
  }

  async function handlePublish(id) {
    try { await updateQuestionStatus(id, 'published'); refreshQuestions() }
    catch (err) { setError(err.message) }
  }
  async function handleUnpublish(id) {
    try { await updateQuestionStatus(id, 'draft'); refreshQuestions() }
    catch (err) { setError(err.message) }
  }
  async function handleDeleteQuestion(id) {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); refreshQuestions() }
    catch (err) { setError(err.message) }
  }

  async function handleFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportSummary(null)
    setError('')
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setError('No rows found in that CSV. Check it has a header row and at least one question.')
        setImporting(false)
        return
      }
      const results = await bulkImportQuestions({ subjectId, topicId: topicId || null, rows })
      setImportSummary(results)
      refreshQuestions()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
      e.target.value = '' // allow re-selecting the same file
    }
  }

  return (
    <div className="page page-wide">
      <h1>Question Bank</h1>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label className="field" style={{ width: 'auto', minWidth: 220 }}>Subject
            <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId('') }}>
              <option value="">-- select subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          {subjectId && (
            <label className="field" style={{ width: 'auto', minWidth: 220 }}>Topic (optional)
              <select value={topicId} onChange={e => setTopicId(e.target.value)}>
                <option value="">-- all topics --</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          )}
        </div>
        {subjectId && (
          <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input placeholder="New topic name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} />
            <button type="submit" className="btn-secondary">Add Topic</button>
          </form>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {subjectId && (
        <div className="card">
          <h3>Bulk import from CSV</h3>
          <p className="muted">
            Have questions in Google Sheets? File &rarr; Download &rarr; Comma Separated Values (.csv), then upload it here.
            Columns needed: <code>question, option_a, option_b, option_c, option_d, correct_answer</code> (A/B/C/D), plus optional <code>explanation, difficulty</code>.
          </p>
          <button type="button" className="btn-secondary" onClick={downloadCSVTemplate}>Download CSV template</button>
          <div style={{ marginTop: 10 }}>
            <input type="file" accept=".csv,text/csv" onChange={handleFileSelected} disabled={importing} />
          </div>
          {importing && <p className="muted">Importing…</p>}
          {importSummary && (
            <div style={{ marginTop: 10 }}>
              <p>
                <span className="seal seal-approved">{importSummary.created} imported</span>
                {importSummary.failed.length > 0 && <span className="seal seal-draft" style={{ marginLeft: 8 }}>{importSummary.failed.length} skipped</span>}
              </p>
              {importSummary.failed.length > 0 && (
                <ul className="muted" style={{ fontSize: 13 }}>
                  {importSummary.failed.map((f, i) => <li key={i}>Row {f.row}: {f.reason}</li>)}
                </ul>
              )}
              <p className="muted">Imported questions are added as Draft — review and publish them below.</p>
            </div>
          )}
        </div>
      )}

      {subjectId && (
        <div className="card">
          <h3>Add a question</h3>
          <form onSubmit={handleAddQuestion}>
            <label className="field">Question text
              <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} required />
            </label>

            {options.map((o, i) => (
              <label key={o.label} className={`bubble-option ${o.isCorrect ? 'selected' : ''}`}>
                <input type="radio" name="correct" checked={o.isCorrect} onChange={() => updateOption(i, 'isCorrect', true)} />
                <span className="bubble">{o.label}</span>
                <input
                  placeholder={`Option ${o.label}`}
                  value={o.text}
                  onChange={e => updateOption(i, 'text', e.target.value)}
                  required
                  style={{ border: 'none', padding: 0, background: 'transparent', flex: 1 }}
                />
              </label>
            ))}
            <p className="muted">Tap the bubble next to the correct answer.</p>

            <label className="field">Explanation (optional)
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)} />
            </label>

            <label className="field" style={{ width: 'auto', display: 'inline-block', marginRight: 16 }}>Difficulty
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <div style={{ marginTop: 12 }}>
              <button type="submit">Add Question (as Draft)</button>
            </div>
          </form>
        </div>
      )}

      {subjectId && (
        <div className="card">
          <h3>Questions ({questions.length})</h3>
          {questions.map(q => (
            <div key={q.id} className="list-item" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <p style={{ margin: 0 }}><strong>{q.question_text}</strong></p>
                <span className={`seal seal-${q.status}`}>{q.status}</span>
              </div>
              <ul style={{ margin: '8px 0' }}>
                {q.question_options?.map(o => (
                  <li key={o.id} style={{ color: o.is_correct ? 'var(--success)' : 'inherit' }}>
                    {o.option_label}. {o.option_text} {o.is_correct && '✓'}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8 }}>
                {q.status === 'draft'
                  ? <button onClick={() => handlePublish(q.id)}>Publish</button>
                  : <button className="btn-secondary" onClick={() => handleUnpublish(q.id)}>Unpublish</button>}
                <button className="btn-danger" onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
              </div>
            </div>
          ))}
          {questions.length === 0 && <p className="muted">No questions yet.</p>}
        </div>
      )}
    </div>
  )
}
