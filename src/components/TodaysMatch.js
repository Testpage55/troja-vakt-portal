function TodaysMatch({ match }) {
  if (!match) {
    return (
      <div className="todays-match no-match">
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
          <p><strong>Tid:</strong> {match.time}</p>
          <p><strong>Typ:</strong> {match.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}</p>
          {match.match_type === 'away' && match.distance_miles && (
            <p><strong>Avstånd:</strong> {match.distance_miles} mil</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TodaysMatch