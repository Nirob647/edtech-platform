import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/student/Dashboard'
import AdminHome from './pages/admin/AdminHome'
import Subjects from './pages/admin/Subjects'
import QuestionBank from './pages/admin/QuestionBank'
import Exams from './pages/admin/Exams'
import ExamEditor from './pages/admin/ExamEditor'
import ExamList from './pages/exams/ExamList'
import TakeExam from './pages/exams/TakeExam'
import ExamResult from './pages/exams/ExamResult'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p>Loading...</p>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { session, loading, isAdmin } = useAuth()
  if (loading) return <p>Loading...</p>
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <AdminRoute>
              <Subjects />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <AdminRoute>
              <QuestionBank />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <AdminRoute>
              <Exams />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exams/:id"
          element={
            <AdminRoute>
              <ExamEditor />
            </AdminRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <ExamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/take"
          element={
            <ProtectedRoute>
              <TakeExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/result/:attemptId"
          element={
            <ProtectedRoute>
              <ExamResult />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
