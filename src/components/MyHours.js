// 📋 FILNAMN: src/components/MyHours.js
// 📄 ÅTGÄRD: ERSÄTT din befintliga MyHours.js med denna FIXADE version

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyHours({ guard }) {
  const [allWorkHours, setAllWorkHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchWorkHours()
  }, [guard.id])

  // Lyssna på uppdateringar
  useEffect(() => {
    const handleWorkHoursUpdated = () => {
      fetchWorkHours()
    }

    window.addEventListener('workHoursUpdated', handleWorkHoursUpdated)
    return () => window.removeEventListener('workHoursUpdated', handleWorkHoursUpdated)
  }, [])

  const fetchWorkHours = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
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
        .lt('work_date', today) // Endast genomförda matcher
        .order('work_date', { ascending: false })
      
      if (error) throw error
      
      setAllWorkHours(data || [])
      
    } catch (error) {
      console.error('Error fetching work hours:', error)
      setAllWorkHours([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Inget datum'
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short'
    })
  }

  // Beräkna totala timmar
  const totalHours = allWorkHours.reduce((sum, wh) => sum + (parseFloat(wh.total_hours) || 0), 0).toFixed(1)
  
  // Bestäm vilka arbetstider som ska visas
  const displayedWorkHours = showAll ? allWorkHours : allWorkHours.slice(0, 3)

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '24px',
          fontSize: '16px',
          color: '#6b7280'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Laddar...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '24px',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Mina Arbetstider
        </h2>

        {/* Badge med pass och timmar */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          gap: '8px'
        }}>
          <span>{allWorkHours.length} pass</span>
          <span>•</span>
          <span>{totalHours}h</span>
        </div>
      </div>

      {/* Arbetstider lista */}
      {allWorkHours.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#6b7280',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e0'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Inga arbetstider än
          </div>
          <div style={{ fontSize: '14px' }}>
            Dina genomförda arbetstider visas här.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayedWorkHours.map(wh => (
              <div
                key={wh.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.3s ease',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '12px',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'white'
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
              >
                {/* Datum */}
                <div style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  minWidth: '55px',
                  textAlign: 'center'
                }}>
                  {formatDate(wh.work_date)}
                </div>

                {/* Match Info */}
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {wh.matches?.opponent || 'Annat uppdrag'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {formatTime(wh.start_time)} - {formatTime(wh.end_time)}
                  </div>
                </div>

                {/* Timmar */}
                <div style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {wh.total_hours ? parseFloat(wh.total_hours).toFixed(1) : '0'}h
                </div>
              </div>
            ))}
          </div>

          {/* Visa alla/färre knapp */}
          {allWorkHours.length > 3 && (
            <div style={{
              textAlign: 'center',
              marginTop: '16px'
            }}>
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  background: 'transparent',
                  border: '2px solid #10b981',
                  color: '#10b981',
                  borderRadius: '12px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#10b981'
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#10b981'
                }}
              >
                {showAll 
                  ? `Visa färre (${allWorkHours.length - 3} dolda)`
                  : `Visa alla (${allWorkHours.length - 3} till)`
                }
              </button>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default MyHours