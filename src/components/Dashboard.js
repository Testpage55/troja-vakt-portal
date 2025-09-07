import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import TodaysMatch from './TodaysMatch'
import TimeRegistration from './TimeRegistration'
import MyHours from './MyHours'

function Dashboard({ guard, onLogout }) {
  const [todaysMatch, setTodaysMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTimeRegistration, setShowTimeRegistration] = useState(false)

  useEffect(() => {
    fetchTodaysMatch()
  }, [guard.id])

  const fetchTodaysMatch = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          assignments!inner(personnel_id, is_working)
        `)
        .eq('date', today)
        .eq('assignments.personnel_id', guard.id)
        .eq('assignments.is_working', true)
        .single()
      
      setTodaysMatch(data)
    } catch (error) {
      console.log('Ingen match idag')
      setTodaysMatch(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Välkommen {guard.name}</h1>
        <button onClick={onLogout} className="logout-btn">
          Logga ut
        </button>
      </header>

      <main className="dashboard-content">
        <TodaysMatch match={todaysMatch} guard={guard} />
        
        {/* Register Time Button */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          marginBottom: 'var(--space-xl)',
          padding: 'var(--space-xl)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', color: 'var(--gray-800)' }}>
            Arbetstidsregistrering
          </h2>
          <button
            onClick={() => setShowTimeRegistration(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: 'var(--touch-target-large)'
            }}
          >
            📋 Registrera arbetstid
          </button>
        </div>

        <MyHours guard={guard} />
      </main>

      {/* Time Registration Modal */}
      {showTimeRegistration && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'var(--space-md)',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            marginTop: 'var(--space-lg)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowTimeRegistration(false)}
              style={{
                position: 'absolute',
                top: 'var(--space-lg)',
                right: 'var(--space-lg)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '1.5rem',
                zIndex: 1001
              }}
            >
              ×
            </button>
            
            <TimeRegistration 
              match={todaysMatch} 
              guard={guard}
              onClose={() => setShowTimeRegistration(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard