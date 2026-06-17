import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import { AuthPage } from './pages/AuthPage'
import { RoomListPage } from './pages/RoomListPage'
import { RoomPage } from './pages/RoomPage'

export default function App() {
  return (
    <BrowserRouter basename="/Progcompy">
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/rooms" element={<RoomListPage />} />
                <Route path="/rooms/:id" element={<RoomPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
