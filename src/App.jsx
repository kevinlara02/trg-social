import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/layout/Layout'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import DataDeletion from './pages/DataDeletion'

// Lazy-loaded so each page ships as its own chunk (faster initial load,
// heavy libs like recharts only download on the pages that use them).
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reviews = lazy(() => import('./pages/Reviews'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Publish = lazy(() => import('./pages/Publish'))
const Connections = lazy(() => import('./pages/Connections'))
const Reports = lazy(() => import('./pages/Reports'))
const Users = lazy(() => import('./pages/Users'))
const Activity = lazy(() => import('./pages/Activity'))
const AIVisibility = lazy(() => import('./pages/AIVisibility'))
const Traffic = lazy(() => import('./pages/Traffic'))
const Social = lazy(() => import('./pages/Social'))
const Location = lazy(() => import('./pages/Location'))
const Trends = lazy(() => import('./pages/Trends'))

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
          {/* Public legal pages (no login) — required for Meta App Review */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reviews"   element={<Reviews />} />
            <Route path="inbox"     element={<Inbox />} />
            <Route path="publish"   element={<Publish />} />
            <Route path="social"    element={<Social />} />
            <Route path="locations/:code" element={<Location />} />
            <Route path="connections" element={<ProtectedRoute adminOnly><Connections /></ProtectedRoute>} />
            <Route path="reports"       element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
            <Route path="trends"        element={<ProtectedRoute adminOnly><Trends /></ProtectedRoute>} />
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
