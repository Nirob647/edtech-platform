import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSubjects } from '../../modules/questions/subjectsService'
import { listTopicsBySubject, createTopic, deleteTopic } from '../../modules/questions/topicsService'
import { listQuestions, createQuestion, updateQuestionStatus, deleteQuestion } from '../../modules/questions/questionsService'

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

  useEffect(() => { listSubjects().then(setSubjects).catch(e => setError(e.message)) }, [])

  useEffect(() => {
    if (!subjectId) { setTopics([]); setTopicId(''); setQuestions([]); return }
    listTopicsBySubject(subjectId).then(setTopics).catch(e => setError(e.message))
    refreshQuestions()
  }, [subjectId])

  useEffect(() => { if (subjectId) refreshQuestions() }, [topicId])

  async function refreshQuestions() {
    try {
      setQuestions(await listQuestions({ subjectId, topicId: topicId || undefined }))
    } catch (e) { setError(e.message) }
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
      if (field === 'isCorrect') {
        return { ...o, isCorrect: i === idx }
      }
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

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/admin">&larr; Admin Dashboard</Link></p>
      <h2>Question Bank</h2>

      <div style={{ marginBottom: 16 }}>
        <label>Subject: </label>
        <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId('') }}>
          <option value="">-- select subject --</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {subjectId && (
          <>
            <label style={{ marginLeft: 16 }}>Topic (optional): </label>
            <select value={topicId} onChange={e => setTopicId(e.target.value)}>
              <option value="">-- all topics --</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </>
        )}
      </div>

      {subjectId && (
        <form onSubmit={handleAddTopic} style={{ marginBottom: 24 }}>
          <input placeholder="New topic name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} />
          <button type="submit" style={{ marginLeft: 8 }}>Add Topic</button>
        </form>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {subjectId && (
        <form onSubmit={handleAddQuestion} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
          <h3>Add Question</h3>
          <textarea placeholder="Question text" value={questionText} onChange={e => setQuestionText(e.target.value)} required style={inputStyle} />

          {options.map((o, i) => (
            <div key={o.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <input
                type="radio"
                name="correct"
                checked={o.isCorrect}
                onChange={() => updateOption(i, 'isCorrect', true)}
                style={{ marginRight: 8 }}
              />
              <strong style={{ width: 20 }}>{o.label}</strong>
              <input
                placeholder={`Option ${o.label}`}
                value={o.text}
                onChange={e => updateOption(i, 'text', e.target.value)}
                required
                style={{ flex: 1, padding: 6 }}
              />
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#666' }}>Select the radio button next to the correct answer.</p>

          <textarea placeholder="Explanation (optional)" value={explanation} onChange={e => setExplanation(e.target.value)} style={inputStyle} />

          <label>Difficulty: </label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <div style={{ marginTop: 12 }}>
            <button type="submit">Add Question (as Draft)</button>
          </div>
        </form>
      )}

      {subjectId && (
        <div>
          <h3>Questions ({questions.length})</h3>
          {questions.map(q => (
            <div key={q.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 10 }}>
              <p><strong>{q.question_text}</strong> <span style={{ fontSize: 12, color: q.status === 'published' ? 'green' : '#999' }}>[{q.status}]</span></p>
              <ul>
                {q.question_options?.map(o => (
                  <li key={o.id} style={{ color: o.is_correct ? 'green' : 'inherit' }}>
                    {o.option_label}. {o.option_text} {o.is_correct && '✓'}
                  </li>
                ))}
              </ul>
              {q.status === 'draft'
                ? <button onClick={() => handlePublish(q.id)}>Publish</button>
                : <button onClick={() => handleUnpublish(q.id)}>Unpublish</button>}
              <button onClick={() => handleDeleteQuestion(q.id)} style={{ marginLeft: 8 }}>Delete</button>
            </div>
          ))}
          {questions.length === 0 && <p>No questions yet.</p>}
        </div>
      )}
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: 8, marginBottom: 10 }
