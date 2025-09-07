import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [currentGuard, setCurrentGuard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kolla om vakt redan är inloggad (från localStorage)
    const savedGuard = localStorage.getItem('currentGuard')
    if (savedGuard) {
      setCurrentGuard(JSON.parse(savedGuard))
    }
    setLoading(false)
  }, [])

  const handleLogin = (guard) => {
    setCurrentGuard(guard)
    localStorage.setItem('currentGuard', JSON.stringify(guard))
  }

  const handleLogout = () => {
    setCurrentGuard(null)
    localStorage.removeItem('currentGuard')
  }

  if (loading) {
    return <div className="loading">Laddar...</div>
  }

  return (
    <div className="app">
      {!currentGuard ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard guard={currentGuard} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App