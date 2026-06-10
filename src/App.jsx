import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Reviews from './pages/Reviews'
import Inbox from './pages/Inbox'
import Publish from './pages/Publish'
import Connections from './pages/Connections'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Activity from './pages/Activity'
import AIVisibility from './pages/AIVisibility'
import Traffic from './pages/Traffic'

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" />
    </div>
  )
}

function ProtectedRoute({ children, adminOnly }) {
  const { session, loading, isAdmin } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function LoginRoute() {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (session) return <Navigate to="/dashboard" replace />
  return <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reviews"   element={<Reviews />} />
            <Route path="inbox"     element={<Inbox />} />
            <Route path="publish"   element={<Publish />} />
            <Route path="connections" element={<ProtectedRoute adminOnly><Connections /></ProtectedRoute>} />
            <Route path="reports"       element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
            <Route path="ai-visibility" element={<ProtectedRoute adminOnly><AIVisibility /></ProtectedRoute>} />
            <Route path="traffic"       element={<ProtectedRoute adminOnly><Traffic /></ProtectedRoute>} />
            <Route path="activity"    element={<ProtectedRoute adminOnly><Activity /></ProtectedRoute>} />
            <Route path="admin"       element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
