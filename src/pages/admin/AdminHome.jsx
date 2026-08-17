import { Link } from 'react-router-dom'

export default function AdminHome() {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <p><Link to="/dashboard">&larr; Back</Link></p>
      <h2>Admin Panel</h2>
      <ul>
        <li><Link to="/admin/subjects">Subjects</Link></li>
        <li><Link to="/admin/questions">Question Bank</Link></li>
      </ul>
    </div>
  )
}
