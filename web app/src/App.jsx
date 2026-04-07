import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { InterviewProvider } from './context/InterviewContext'
import LoginPage from './pages/LoginPage'
import LiveInterviewArena from './pages/LiveInterviewArena'
import AppShell from './pages/AppShell'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import ReportPage from './pages/ReportPage'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function RootRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <LoginPage />
}

function ProtectedShell() {
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  )
}

function App() {
  return (
    <InterviewProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/app" element={<ProtectedShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="interview" element={<LiveInterviewArena />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="report" element={<ReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InterviewProvider>
  )
}

export default App
