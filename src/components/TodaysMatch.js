function TodaysMatch({ match }) {
  if (!match) {
    return (
      <div className="no-match">
        <h2>Ingen match idag</h2>
        <p>Du kan fortfarande registrera arbetstid för andra uppdrag.</p>
      </div>
    )
  }

  return (
    <div className="todays-match">
      <h2>Dagens match</h2>
      <div className="match-card">
        <h3>{match.opponent}</h3>
        <div className="match-details">
          <p>
            <span>🕐</span>
            <span className="match-time">{match.time || 'TBA'}</span>
          </p>
          <p>
            <span>🏟️</span>
            <span className="match-type">
              {match.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}
            </span>
          </p>
          {match.match_type === 'away' && match.distance_miles && (
            <p>
              <span>📍</span>
              <span>Avstånd: {match.distance_miles} mil</span>
            </p>
          )}
          <p>
            <span>📅</span>
            <span>{new Date(match.date).toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default TodaysMatch