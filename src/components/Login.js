// NYTT Login.js - Ersätt HELA innehållet i din Login.js med denna kod

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [personnel, setPersonnel] = useState([])
  const [selectedGuard, setSelectedGuard] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonnel()
  }, [])

  const fetchPersonnel = async () => {
    try {
      const { data } = await supabase
        .from('personnel')
        .select('*')
        .order('name')
      
      setPersonnel(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedGuard) {
      const guard = personnel.find(p => p.id === parseInt(selectedGuard))
      onLogin(guard)
    }
  }

  if (loading) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="loading">
            <div className="spinner"></div>
            Laddar vakter...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login-card">
        {/* Logo/Icon */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-lg)',
          fontSize: '48px',
          color: 'var(--primary)',
          fontWeight: '900'
        }}>
          TROJA
        </div>
        
        <h1>Troja-Ljungby Vaktportal</h1>
        
        {/* Welcome text */}
        <p style={{
          textAlign: 'center',
          color: 'var(--gray-600)',
          marginBottom: 'var(--space-xl)',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Välkommen till den moderna vaktportalen. Logga in för att registrera arbetstider och hantera dina uppdrag.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-sm)'
            }}>
              Välj ditt namn
            </span>
            <select 
              value={selectedGuard} 
              onChange={(e) => setSelectedGuard(e.target.value)}
              required
              style={{
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '40px'
              }}
            >
              <option value="">Välj vakt...</option>
              {personnel.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          
          <button 
            type="submit" 
            disabled={!selectedGuard}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            Logga in
          </button>
        </form>

        {/* Footer info */}
        <div style={{
          marginTop: 'var(--space-xl)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--gray-500)'
        }}>
          <p>Säker inloggning • Modern design • Snabb registrering</p>
        </div>
      </div>
    </div>
  )
}

export default Login