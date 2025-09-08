// NYTT Dashboard.js - Ersätt HELA innehållet i din Dashboard.js med denna kod

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import TodaysMatch from './TodaysMatch'
import TimeRegistration from './TimeRegistration'
import MyHours from './MyHours'

function Dashboard({ guard, onLogout }) {
  const [todaysMatch, setTodaysMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTimeRegistration, setShowTimeRegistration] = useState(false)
  const [editingWorkHour, setEditingWorkHour] = useState(null)

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

  const handleNewRegistration = () => {
    setEditingWorkHour(null)
    setShowTimeRegistration(true)
  }

  const handleEditWorkHour = (workHour) => {
    setEditingWorkHour(workHour)
    setShowTimeRegistration(true)
  }

  const handleCloseModal = () => {
    setShowTimeRegistration(false)
    setEditingWorkHour(null)
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          Laddar dashboard...
        </div>
      </div>
    )
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
        
        {/* Quick Registration Card */}
        <div style={{ 
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          marginBottom: 'var(--space-xl)',
          padding: 'var(--space-xl)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
            transform: 'rotate(25deg)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ 
              marginBottom: 'var(--space-lg)', 
              color: 'var(--gray-800)',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Snabb Registrering
            </h2>
            <p style={{
              marginBottom: 'var(--space-xl)',
              color: 'var(--gray-600)',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Registrera arbetstid för matcher snabbt och enkelt med vår smarta formulär
            </p>
            <button
              onClick={handleNewRegistration}
              className="btn btn-primary"
              style={{
                fontSize: '18px',
                padding: 'var(--space-lg) var(--space-2xl)',
                borderRadius: 'var(--radius-xl)',
                minHeight: 'var(--touch-target-large)',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                boxShadow: '0 12px 28px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)'
                e.target.style.boxShadow = '0 16px 36px rgba(239, 68, 68, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 12px 28px rgba(239, 68, 68, 0.3)'
              }}
            >
              Registrera Arbetstid
            </button>
          </div>
        </div>

        <MyHours guard={guard} onEditWorkHour={handleEditWorkHour} />
      </main>

      {/* Time Registration Modal */}
      {showTimeRegistration && (
        <div className="time-registration-modal">
          <div className="time-registration-content">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="close-button"
              title="Stäng"
            >
              ×
            </button>
            
            <TimeRegistration 
              match={todaysMatch} 
              guard={guard}
              editingWorkHour={editingWorkHour}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard