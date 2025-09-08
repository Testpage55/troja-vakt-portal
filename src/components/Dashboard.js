// UPPDATERAD Dashboard.js med Kommande Matcher sektion

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
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)

  useEffect(() => {
    fetchTodaysMatch()
    fetchUpcomingMatches()
  }, [guard.id])

  // Event listener för registreringsknapparna i TodaysMatch
  useEffect(() => {
    const handleOpenTimeRegistration = () => {
      handleNewRegistration()
    }
    
    window.addEventListener('openTimeRegistration', handleOpenTimeRegistration)
    
    return () => {
      window.removeEventListener('openTimeRegistration', handleOpenTimeRegistration)
    }
  }, [])

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

  const fetchUpcomingMatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('matches')
        .select('*')
        .gt('date', today)
        .order('date', { ascending: true })
        .limit(5)
      
      setUpcomingMatches(data || [])
    } catch (error) {
      console.error('Error fetching upcoming matches:', error)
      setUpcomingMatches([])
    } finally {
      setLoadingUpcoming(false)
    }
  }

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = date.toLocaleDateString('sv-SE')
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' })
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return `${dateStr} (IMORGON)`
    }
    
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    if (date >= weekStart && date <= weekEnd) {
      return `${dateStr} (${dayName.toUpperCase()})`
    }
    
    return `${dateStr} (${dayName})`
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
        <TodaysMatch match={todaysMatch} guard={guard} onRegisterTime={handleNewRegistration} />
        
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
              Registrera arbetstid för matcher snabbt och enkelt med vårt smarta formulär
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
            >
              Registrera Arbetstid
            </button>
          </div>
        </div>

        <MyHours guard={guard} onEditWorkHour={handleEditWorkHour} />

        {/* Kommande Matcher Sektion */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: 'var(--space-xl)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)'
        }}>
          <h2 style={{
            marginBottom: 'var(--space-lg)',
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--gray-800)'
          }}>
            Kommande Matcher
          </h2>

          {loadingUpcoming ? (
            <div className="loading">
              <div className="spinner"></div>
              Laddar kommande matcher...
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-2xl)',
              color: 'var(--gray-600)',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--gray-300)'
            }}>
              <h3 style={{
                margin: '0 0 var(--space-md) 0',
                color: 'var(--gray-700)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Inga kommande matcher
              </h3>
              <p style={{ margin: 0 }}>
                Det finns inga schemalagda matcher för tillfället.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)'
            }}>
              {upcomingMatches.map(match => (
                <div
                  key={match.id}
                  style={{
                    background: 'linear-gradient(135deg, var(--gray-50) 0%, white 100%)',
                    padding: 'var(--space-lg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--gray-200)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: 'var(--space-md)',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--primary)',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      {formatMatchDate(match.date)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)'
                    }}>
                      {match.time || 'TBA'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontWeight: '700',
                      color: 'var(--gray-800)',
                      fontSize: '16px',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      {match.opponent}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--gray-600)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}>
                      <span>{match.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}</span>
                      {match.match_type === 'away' && match.distance_miles && (
                        <span> • {match.distance_miles} mil</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Time Registration Modal */}
      {showTimeRegistration && (
        <div className="time-registration-modal">
          <div className="time-registration-content">
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