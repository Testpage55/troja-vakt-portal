// TodaysMatch.js - Ersätt din befintliga TodaysMatch.js med denna kod

function TodaysMatch({ match }) {
  if (!match) {
    return (
      <div className="todays-match">
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
          color: 'var(--gray-800)',
          fontSize: '20px',
          fontWeight: '700'
        }}>
          📅 Dagens Match
        </h2>
        <div className="no-match">
          <div style={{
            fontSize: '48px',
            marginBottom: 'var(--space-md)',
            opacity: 0.6
          }}>
            🏈
          </div>
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
      </div>
    )
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

  return (
    <div className="todays-match">
      <h2 style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-lg)',
        color: 'var(--gray-800)',
        fontSize: '20px',
        fontWeight: '700'
      }}>
        🔥 Dagens Match
      </h2>
      
      <div className="match-card">
        {/* Team Name */}
        <h3 style={{
          margin: '0 0 var(--space-lg) 0',
          fontSize: '28px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1
        }}>
          🆚 {match.opponent}
        </h3>
        
        {/* Match Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-lg)',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Time */}
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
              <span style={{ fontSize: '20px' }}>🕐</span>
              <span>{match.time || 'TBA'}</span>
            </div>
          </div>

          {/* Match Type */}
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
              <span style={{ fontSize: '20px' }}>
                {match.match_type === 'away' ? '✈️' : '🏠'}
              </span>
              <span>
                {match.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}
              </span>
            </div>
          </div>

          {/* Distance (if away match) */}
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
                <span style={{ fontSize: '20px' }}>📍</span>
                <span>{match.distance_miles} mil</span>
              </div>
            </div>
          )}

          {/* Date */}
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
              <span style={{ fontSize: '20px' }}>📅</span>
              <span style={{ lineHeight: '1.4' }}>
                {formatDate(match.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
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
            <span>✅</span>
            <span>Du är tilldelad denna match</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodaysMatch