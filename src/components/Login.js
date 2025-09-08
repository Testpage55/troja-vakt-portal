// HELT REN Login.js UTAN välkomsttext

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
      
      // Custom sortering enligt önskemål
      const sortedPersonnel = sortPersonnelByPriority(data || [])
      setPersonnel(sortedPersonnel)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortPersonnelByPriority = (personnelList) => {
    // Prioriterade vakter i önskad ordning
    const priorityOrder = ['Micke', 'Jocke', 'Gary', 'Tomas', 'Patrik', 'Jozsef']
    
    // Dela upp i prioriterade och övriga
    const priorityPersonnel = []
    const otherPersonnel = []
    
    // Först lägg till prioriterade i rätt ordning
    priorityOrder.forEach(priorityName => {
      const person = personnelList.find(p => 
        p.name.toLowerCase().trim() === priorityName.toLowerCase().trim()
      )
      if (person) {
        priorityPersonnel.push(person)
      }
    })
    
    // Sedan lägg till alla andra, sorterade alfabetiskt
    personnelList.forEach(person => {
      const isPriority = priorityOrder.some(priorityName => 
        person.name.toLowerCase().trim() === priorityName.toLowerCase().trim()
      )
      if (!isPriority) {
        otherPersonnel.push(person)
      }
    })
    
    // Sortera övriga alfabetiskt
    otherPersonnel.sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'))
    
    // Kombinera listorna
    return [...priorityPersonnel, ...otherPersonnel]
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
        {/* Troja Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-xl)',
        }}>
          <img 
            src="/troja-logo.png" 
            alt="Troja Ljungby" 
            style={{
              maxWidth: '200px',
              height: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              marginBottom: 'var(--space-md)'
            }}
            onError={(e) => {
              // Fallback till text om bilden inte hittas
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <div style={{
            display: 'none',
            fontSize: '48px',
            color: 'var(--primary)',
            fontWeight: '900',
            marginBottom: 'var(--space-md)'
          }}>
            TROJA
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--primary)',
            margin: 0,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Troja Vaktportal
          </h1>
        </div>

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
              {personnel.map((person, index) => (
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
      </div>
    </div>
  )
}

export default Login