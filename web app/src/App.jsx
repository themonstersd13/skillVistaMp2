import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { InterviewProvider } from './context/InterviewContext'
import LoginPage from './pages/LoginPage'
import LiveInterviewArena from './pages/LiveInterviewArena'
import AppShell from './pages/AppShell'
import HistoryPage from './pages/HistoryPage'
import OverviewPage from './pages/OverviewPage'
import ProfilePage from './pages/ProfilePage'
import ReportPage from './pages/ReportPage'
import SetupPage from './pages/SetupPage'
import FacultyDashboardPage from './pages/FacultyDashboardPage'

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
    return <Navigate to="/app/overview" replace />
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
          <Route index element={<Navigate to="/app/overview" replace />} />
          <Route path="dashboard" element={<Navigate to="/app/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="interview" element={<LiveInterviewArena />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="faculty" element={<FacultyDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InterviewProvider>
  )
}

export default App
