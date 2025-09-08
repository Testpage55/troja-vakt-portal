// TodaysMatch.js - UTAN "Dagens Match" rubrik

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function TodaysMatch({ match, onRegisterTime }) {
  const [nextMatch, setNextMatch] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [loadingNext, setLoadingNext] = useState(false)

  useEffect(() => {
    if (!match) {
      fetchNextMatch()
    }
  }, [match])

  useEffect(() => {
    let interval = null
    
    if (!match && nextMatch) {
      interval = setInterval(() => {
        updateCountdown()
      }, 1000)
      updateCountdown()
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [nextMatch, match])

  const fetchNextMatch = async () => {
    setLoadingNext(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('matches')
        .select('*')
        .gt('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single()
      
      setNextMatch(data)
    } catch (error) {
      console.log('Ingen kommande match hittades')
      setNextMatch(null)
    } finally {
      setLoadingNext(false)
    }
  }

  const updateCountdown = () => {
    if (!nextMatch) return
    
    const now = new Date()
    const matchDateTime = new Date(`${nextMatch.date}T${nextMatch.time || '19:00'}:00`)
    const timeDiff = matchDateTime - now
    
    if (timeDiff <= 0) {
      setCountdown('Matchen har startat!')
      return
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
    
    let countdownText = ''
    
    if (days > 0) {
      countdownText = `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      countdownText = `${hours}h ${minutes}m ${seconds}s`
    } else {
      countdownText = `${minutes}m ${seconds}s`
    }
    
    setCountdown(countdownText)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleRegisterClick = () => {
    if (onRegisterTime) {
      onRegisterTime()
    } else {
      window.dispatchEvent(new CustomEvent('openTimeRegistration'))
    }
  }

  // Om det finns en match idag - UTAN rubrik
  if (match) {
    return (
      <div className="todays-match">
        {/* BORTTAGET: <h2>Dagens Match</h2> */}
        
        <div className="match-card">
          <h3 style={{
            margin: '0 0 var(--space-lg) 0',
            fontSize: '28px',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1
          }}>
            {match.opponent}
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-lg)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                <span>{match.time || 'TBA'}</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                <span>
                  {match.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}
                </span>
              </div>
            </div>

            {match.match_type === 'away' && match.distance_miles && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-md)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-sm)',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  <span>{match.distance_miles} mil</span>
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              gridColumn: match.match_type === 'home' || !match.distance_miles ? 'span 1' : 'span 2'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                <span style={{ lineHeight: '1.4' }}>
                  {formatDate(match.date)}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius-xl)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)'
            }}>
              <span>Du är tilldelad denna match</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Om det inte finns en match idag - UTAN rubrik
  return (
    <div className="todays-match">
      {/* BORTTAGET: <h2>Dagens Match</h2> */}
      
      {loadingNext ? (
        <div className="no-match">
          <h3 style={{
            margin: '0 0 var(--space-md) 0',
            color: 'var(--gray-700)',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Laddar...
          </h3>
        </div>
      ) : nextMatch ? (
        <div style={{
          background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(248, 113, 113, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{
              margin: '0 0 var(--space-sm) 0',
              fontSize: '18px',
              fontWeight: '600',
              opacity: 0.9
            }}>
              Nästa match
            </h3>
            
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: 'var(--space-md)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              IF Troja-Ljungby - {nextMatch.opponent}
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-lg)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: 'var(--space-xs)',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}>
                {countdown}
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.9,
                fontWeight: '500'
              }}>
                {countdown.includes('d') ? 'kvar till match' : 'kvar till matchstart'}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: 'var(--space-lg)'
            }}>
              <div>{formatDate(nextMatch.date)}</div>
              <div>{nextMatch.time || 'TBA'}</div>
              <div>{nextMatch.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}</div>
            </div>

            <button
              onClick={handleRegisterClick}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--primary)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-md) var(--space-xl)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                width: '100%',
                maxWidth: '250px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'white'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Registrera arbetstid
            </button>
          </div>
        </div>
      ) : (
        <div className="no-match">
          <h3 style={{
            margin: '0 0 var(--space-md) 0',
            color: 'var(--gray-700)',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Ingen match idag
          </h3>
          <p style={{
            margin: 0,
            color: 'var(--gray-600)',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            Du kan fortfarande registrera arbetstid för andra uppdrag eller kommande matcher.
          </p>
        </div>
      )}
    </div>
  )
}

export default TodaysMatch