// MyHours.js - Ersätt din befintliga MyHours.js med denna kod

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyHours({ guard, onEditWorkHour }) {
  const [workHours, setWorkHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchMyHours()
  }, [guard.id])

  // Lyssna på uppdateringar från TimeRegistration
  useEffect(() => {
    const handleWorkHoursUpdated = () => {
      fetchMyHours()
    }

    window.addEventListener('workHoursUpdated', handleWorkHoursUpdated)
    return () => window.removeEventListener('workHoursUpdated', handleWorkHoursUpdated)
  }, [])

  const fetchMyHours = async () => {
    setLoading(true)
    try {
      const limit = showAll ? 50 : 10
      const { data, error } = await supabase
        .from('work_hours')
        .select(`
          *,
          matches (
            date,
            opponent,
            time,
            match_type
          )
        `)
        .eq('personnel_id', guard.id)
        .order('work_date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      setWorkHours(data || [])
    } catch (error) {
      console.error('Error fetching work hours:', error)
      // Fallback query without matches relation
      try {
        const limit = showAll ? 50 : 10
        const { data: altData, error: altError } = await supabase
          .from('work_hours')
          .select('*')
          .eq('personnel_id', guard.id)
          .order('work_date', { ascending: false })
          .limit(limit)
        
        if (altError) throw altError
        setWorkHours(altData || [])
      } catch (altError) {
        console.error('Alt query failed:', altError)
        setWorkHours([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (workHour) => {
    if (onEditWorkHour) {
      onEditWorkHour(workHour)
    }
  }

  const handleDelete = async (workHourId) => {
    const workHour = workHours.find(wh => wh.id === workHourId)
    const opponent = workHour?.matches?.opponent || 'detta pass'
    
    const confirmed = window.confirm(
      `Är du säker på att du vill ta bort arbetstiden för ${opponent}?`
    )
    
    if (!confirmed) return

    setDeleting(workHourId)
    try {
      const { error } = await supabase
        .from('work_hours')
        .delete()
        .eq('id', workHourId)
        .eq('personnel_id', guard.id)

      if (error) throw error

      setWorkHours(prev => prev.filter(wh => wh.id !== workHourId))
      
      // Trigga event för att uppdatera andra komponenter
      window.dispatchEvent(new CustomEvent('workHoursUpdated'))
      
    } catch (error) {
      console.error('Error deleting work hours:', error)
      alert('Fel vid borttagning: ' + (error.message || 'Okänt fel'))
    } finally {
      setDeleting(null)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Inget datum'
    return new Date(dateString).toLocaleDateString('sv-SE')
  }

  const totalHours = workHours.reduce((sum, wh) => {
    const hours = wh.total_hours || 0
    return sum + parseFloat(hours)
  }, 0)

  if (loading) {
    return (
      <div className="my-hours">
        <div className="loading">
          <div className="spinner"></div>
          Laddar dina timmar...
        </div>
      </div>
    )
  }

  return (
    <div className="my-hours">
      <h2 style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-lg)',
        color: 'var(--gray-800)',
        fontSize: '20px',
        fontWeight: '700'
      }}>
        📊 Dina Arbetstider
      </h2>
      
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)'
      }}>
        {/* Total Hours Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(168, 237, 234, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '36px', marginBottom: 'var(--space-sm)' }}>⏱️</div>
            <h3 style={{ 
              margin: '0 0 var(--space-xs) 0',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--gray-800)'
            }}>
              {totalHours.toFixed(1)}h
            </h3>
            <p style={{ 
              margin: 0,
              color: 'var(--gray-700)',
              fontWeight: '600'
            }}>
              Totalt denna säsong
            </p>
          </div>
        </div>

        {/* Total Assignments Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '36px', marginBottom: 'var(--space-sm)' }}>📈</div>
            <h3 style={{ 
              margin: '0 0 var(--space-xs) 0',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              {workHours.length}
            </h3>
            <p style={{ 
              margin: 0,
              opacity: 0.9,
              fontWeight: '600'
            }}>
              Antal pass
            </p>
          </div>
        </div>
      </div>

      {/* Work Hours List */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--gray-800)'
          }}>
            Senaste registreringar
          </h3>
          <button
            onClick={() => {
              setShowAll(!showAll)
              if (!showAll) {
                fetchMyHours()
              }
            }}
            style={{
              background: 'var(--gray-100)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--gray-700)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--gray-200)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--gray-100)'
            }}
          >
            {showAll ? 'Visa färre' : 'Visa fler'}
          </button>
        </div>

        {workHours.length === 0 ? (
          <div className="no-match">
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)', opacity: 0.6 }}>
              📝
            </div>
            <h3 style={{
              margin: '0 0 var(--space-md) 0',
              color: 'var(--gray-700)',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Inga arbetstider registrerade än
            </h3>
            <p style={{
              margin: '0 0 var(--space-lg) 0',
              color: 'var(--gray-600)',
              fontSize: '16px'
            }}>
              Klicka på "Registrera Arbetstid" för att komma igång.
            </p>
            <button 
              onClick={fetchMyHours}
              className="btn btn-primary"
              style={{ fontSize: '14px', padding: 'var(--space-sm) var(--space-md)' }}
            >
              🔄 Uppdatera
            </button>
          </div>
        ) : (
          <div className="hours-table">
            {workHours.map(wh => (
              <div key={wh.id} className="hours-row" style={{
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                position: 'relative',
                transition: 'all 0.3s ease',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1.5fr auto auto',
                gap: 'var(--space-md)',
                alignItems: 'center'
              }}>
                {/* Date */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--gray-800)',
                    fontSize: '15px'
                  }}>
                    {formatDate(wh.work_date)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--gray-500)',
                    fontWeight: '500'
                  }}>
                    {wh.matches?.date && formatDate(wh.matches.date)}
                  </div>
                </div>
                
                {/* Match/Assignment */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--gray-800)',
                    fontSize: '15px'
                  }}>
                    {wh.matches?.opponent || 'Annat uppdrag'}
                  </div>
                  {wh.matches?.match_type && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)'
                    }}>
                      <span>{wh.matches.match_type === 'away' ? '✈️' : '🏠'}</span>
                      <span>{wh.matches.match_type === 'away' ? 'Borta' : 'Hemma'}</span>
                    </div>
                  )}
                </div>
                
                {/* Time */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--gray-800)',
                    fontSize: '15px'
                  }}>
                    {formatTime(wh.start_time)} - {formatTime(wh.end_time)}
                  </div>
                  {wh.notes && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)',
                      fontStyle: 'italic'
                    }}>
                      {wh.notes.substring(0, 30)}{wh.notes.length > 30 ? '...' : ''}
                    </div>
                  )}
                </div>

                {/* Total Hours */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '14px',
                    fontWeight: '700',
                    minWidth: '60px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }}>
                    {wh.total_hours ? parseFloat(wh.total_hours).toFixed(1) : '0'}h
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-xs)'
                }}>
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(wh)}
                    style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      color: 'var(--primary)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--primary)'
                      e.target.style.color = 'white'
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(102, 126, 234, 0.1)'
                      e.target.style.color = 'var(--primary)'
                      e.target.style.transform = 'scale(1)'
                    }}
                    title="Redigera arbetstid"
                  >
                    ✏️
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(wh.id)}
                    disabled={deleting === wh.id}
                    className="btn-delete-small"
                    title="Ta bort arbetstid"
                  >
                    {deleting === wh.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
            
            <div style={{
              textAlign: 'center',
              marginTop: 'var(--space-lg)'
            }}>
              <button 
                onClick={fetchMyHours}
                style={{
                  background: 'var(--gray-100)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm) var(--space-lg)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--gray-200)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--gray-100)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                🔄 Uppdatera lista
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyHours