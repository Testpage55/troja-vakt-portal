// 🔋 FILNAMN: src/components/Login.js
// 📄 ÅTGÄRD: ÅTERSTÄLLD till ren version - endast logo-växling för Jozsef

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [personnel, setPersonnel] = useState([])
  const [selectedGuard, setSelectedGuard] = useState('')
  const [loading, setLoading] = useState(true)
  const [logoSrc, setLogoSrc] = useState('/troja-logo.png')

  useEffect(() => {
    document.title = 'Troja Vaktportal - Logga in'
    fetchPersonnel()
  }, [])

  // Logo-växling när selectedGuard ändras
  useEffect(() => {
    if (!selectedGuard) {
      setLogoSrc('/troja-logo.png')
      return
    }

    const selectedPerson = personnel.find(p => p.id === parseInt(selectedGuard))
    
    if (selectedPerson) {
      const personName = selectedPerson.name.toLowerCase().trim()
      
      if (personName === 'jozsef') {
        setLogoSrc('/jason.png')
      } else {
        setLogoSrc('/troja-logo.png')
      }
    }
  }, [selectedGuard, personnel])

  const fetchPersonnel = async () => {
    try {
      const { data } = await supabase
        .from('personnel')
        .select('*')
      
      const filteredPersonnel = filterAndSortPersonnel(data || [])
      setPersonnel(filteredPersonnel)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPersonnel = (personnelList) => {
    const allowedGuards = ['Micke', 'Tomas', 'Jocke', 'Patrik', 'Gary', 'Jozsef']
    const filteredPersonnel = []
    
    allowedGuards.forEach(guardName => {
      const person = personnelList.find(p => 
        p.name.toLowerCase().trim() === guardName.toLowerCase().trim()
      )
      if (person) {
        filteredPersonnel.push(person)
      }
    })
    
    return filteredPersonnel
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ color: '#6b7280', fontSize: '16px' }}>
            Laddar vakter...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        
        {/* Logo-sektion */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <img 
            src={logoSrc}
            alt={logoSrc.includes('jason') ? 'Jason Logo' : 'Troja Ljungby Logo'}
            style={{
              maxWidth: '200px',
              height: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              marginBottom: '16px',
              transition: 'all 0.5s ease'
            }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          
          {/* Fallback text */}
          <div style={{
            display: 'none',
            fontSize: '48px',
            color: '#ef4444',
            fontWeight: '900',
            marginBottom: '16px'
          }}>
            {logoSrc.includes('jason') ? 'JASON' : 'TROJA'}
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            margin: 0,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {logoSrc.includes('jason') ? 'Jag ❤️ Franke-portal' : 'Troja Vaktportal'}
          </h1>
        </div>

        {/* Formulär */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            <span>Välj ditt namn</span>
            <select 
              value={selectedGuard} 
              onChange={(e) => setSelectedGuard(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                background: 'white',
                color: '#374151',
                outline: 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px',
                paddingRight: '40px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ef4444'
                e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="">Välj ordningsvakt...</option>
              {personnel.map((person) => (
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
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background: selectedGuard 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: selectedGuard ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: selectedGuard ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedGuard) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedGuard) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
              }
            }}
          >
            <span>🚀</span>
            Logga in
          </button>
        </form>

        {/* Footer info */}
        {personnel.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '8px',
            background: '#f8fafc',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            {personnel.length} tillgängliga vakter
          </div>
        )}
      </div>
    </div>
  )
}

export default Login