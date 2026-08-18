import { Link } from 'react-router-dom'

export default function AdminHome() {
  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <p className="muted">Manage subjects, the question bank, and exams.</p>

      <div className="card">
        <h3>Subjects</h3>
        <p>Organize academic content into subjects — the foundation everything else builds on.</p>
        <Link to="/admin/subjects"><button>Manage Subjects</button></Link>
      </div>
      <div className="card">
        <h3>Question Bank</h3>
        <p>Add topics and MCQ questions, then publish them for use in exams.</p>
        <Link to="/admin/questions"><button>Manage Questions</button></Link>
      </div>
      <div className="card">
        <h3>Exams</h3>
        <p>Build exams from published questions, configure rules, and publish for students.</p>
        <Link to="/admin/exams"><button>Manage Exams</button></Link>
      </div>
    </div>
  )
}
