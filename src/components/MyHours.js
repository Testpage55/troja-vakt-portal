// 📋 FILNAMN: src/components/MyHours.js
// 🔄 ÅTGÄRD: ERSÄTT din befintliga MyHours.js med denna KOMPLETTA version

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyHours({ guard }) {
  const [workHours, setWorkHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('recent') // recent, month, season
  const [stats, setStats] = useState({
    totalHours: 0,
    totalMatches: 0
  })

  useEffect(() => {
    fetchWorkHours()
  }, [guard.id, timeFilter])

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
      
      let query = supabase
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
        .lt('work_date', today) // Endast matcher som redan har spelats
        .order('work_date', { ascending: false })

      // Applicera filter
      if (timeFilter === 'recent') {
        query = query.limit(10)
      } else if (timeFilter === 'month') {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        query = query.gte('work_date', startOfMonth.toISOString().split('T')[0])
      } else if (timeFilter === 'season') {
        // Antag säsong = från september till maj
        const currentYear = new Date().getFullYear()
        const seasonStart = new Date(currentYear, 8, 1) // September
        query = query.gte('work_date', seasonStart.toISOString().split('T')[0])
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Filtrera bort arbetstider för framtida matcher
      const completedWorkHours = (data || []).filter(wh => {
        if (!wh.matches || !wh.matches.date) return true
        return wh.matches.date < today
      })
      
      setWorkHours(completedWorkHours)
      calculateStats(completedWorkHours)
    } catch (error) {
      console.error('Error fetching work hours:', error)
      setWorkHours([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (hours) => {
    const totalHours = hours.reduce((sum, wh) => sum + (parseFloat(wh.total_hours) || 0), 0)
    const totalMatches = hours.length

    setStats({
      totalHours: totalHours.toFixed(1),
      totalMatches
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Inget datum'
    const date = new Date(dateString)
    
    // Visa bara datum direkt, ingen "dagar sedan" logik
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'recent': return 'Senaste 10 genomförda'
      case 'month': return 'Genomförda denna månad'
      case 'season': return 'Genomförda denna säsong'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '32px',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '48px',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Laddar arbetstider...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '32px',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Genomförda Arbetstider
        </h2>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '4px'
        }}>
          {[
            { key: 'recent', label: 'Senaste' },
            { key: 'month', label: 'Månaden' },
            { key: 'season', label: 'Säsongen' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: timeFilter === filter.key ? 'white' : 'transparent',
                color: timeFilter === filter.key ? '#ef4444' : '#6b7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: timeFilter === filter.key ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Endast 2 viktigaste statistik kort */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            {stats.totalHours}h
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>
            {getFilterLabel()}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            {stats.totalMatches}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}>
            Antal pass
          </div>
        </div>
      </div>

      {/* Work Hours List */}
      {workHours.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: '#6b7280',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '2px dashed #cbd5e0'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            color: '#374151',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Inga genomförda arbetstider {getFilterLabel().toLowerCase()}
          </h3>
          <p style={{ margin: 0 }}>
            {timeFilter === 'recent' && 'Du har inga registrerade arbetstider för genomförda matcher än.'}
            {timeFilter === 'month' && 'Du har inga genomförda arbetstider denna månad.'}
            {timeFilter === 'season' && 'Du har inga genomförda arbetstider denna säsong.'}
          </p>
        </div>
      ) : (
        <div>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            {getFilterLabel()} arbetstider
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {workHours.map(wh => (
              <div
                key={wh.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.3s ease',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto',
                  gap: '16px',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'white'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                {/* Date */}
                <div style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textAlign: 'center',
                  minWidth: '65px'
                }}>
                  {formatDate(wh.work_date)}
                </div>

                {/* Match Info */}
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    fontSize: '15px',
                    marginBottom: '2px'
                  }}>
                    {wh.matches?.opponent || 'Annat uppdrag'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {wh.matches?.match_type && (
                      <span>{wh.matches.match_type === 'away' ? '🚌' : '🏠'}</span>
                    )}
                    {wh.notes && (
                      <span>{wh.notes.substring(0, 15)}{wh.notes.length > 15 ? '...' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Working Hours */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    {formatTime(wh.start_time)} - {formatTime(wh.end_time)}
                  </div>
                </div>

                {/* Total Hours Badge */}
                <div style={{
                  background: parseFloat(wh.total_hours) === 4.5 
                    ? '#10b981' 
                    : '#f59e0b',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textAlign: 'center',
                  minWidth: '45px'
                }}>
                  {wh.total_hours ? parseFloat(wh.total_hours).toFixed(1) : '0'}h
                </div>
              </div>
            ))}
          </div>

          {/* Kompakt Summary */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <strong>{getFilterLabel()}:</strong> {stats.totalHours}h över {stats.totalMatches} pass
            </div>
          </div>
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