// 📋 FILNAMN: src/components/AssignedMatches.js
// 📄 ÅTGÄRD: ERSÄTT din befintliga AssignedMatches.js med denna MOBILANPASSADE version

import { useState } from 'react'
import MatchPersonnelModal from './MatchPersonnelModal'

function AssignedMatches({ assignments, onEditTimes }) {
  const [showAll, setShowAll] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showPersonnelModal, setShowPersonnelModal] = useState(false)

  // Detektera skärmstorlek
  const isMobile = window.innerWidth <= 768
  const isSmallMobile = window.innerWidth <= 480

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Inget datum'
    
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (isMobile) {
      // Kortare format på mobil
      if (date.toDateString() === today.toDateString()) {
        return 'Idag'
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Imorgon'
      }
      return date.toLocaleDateString('sv-SE', { 
        day: 'numeric', 
        month: 'short'
      })
    }
    
    // Fullständigt format på desktop
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    const formattedDate = date.toLocaleDateString('sv-SE', options)
    
    if (date.toDateString() === today.toDateString()) {
      return `${formattedDate} (IDAG)`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `${formattedDate} (IMORGON)`
    }
    
    return formattedDate
  }

  const handleMatchClick = (match) => {
    setSelectedMatch(match)
    setShowPersonnelModal(true)
  }

  const handleCloseModal = () => {
    setShowPersonnelModal(false)
    setSelectedMatch(null)
  }

  const handleBadgeClick = () => {
    setShowAll(!showAll)
  }

  // Enkel filtrering av framtida matcher
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const futureMatches = assignments
    .filter(assignment => {
      if (!assignment || !assignment.match || !assignment.match.date) return false
      const matchDate = new Date(assignment.match.date)
      matchDate.setHours(0, 0, 0, 0)
      return matchDate >= today
    })
    .sort((a, b) => new Date(a.match.date) - new Date(b.match.date))

  // Bestäm vilka matcher som ska visas
  const matchesToShow = showAll ? futureMatches : futureMatches.slice(0, 3)

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: isMobile ? '20px' : '32px',
      borderRadius: isMobile ? '16px' : '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginBottom: isMobile ? '16px' : '24px'
    }}>
      {/* Header med badge - MOBILANPASSAD */}
      <div style={{
        display: 'flex',
        flexDirection: isSmallMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isSmallMobile ? 'center' : 'center',
        gap: isSmallMobile ? '12px' : '0',
        marginBottom: isMobile ? '20px' : '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '700',
          color: '#1f2937',
          textAlign: isSmallMobile ? 'center' : 'left'
        }}>
          Kommande Matcher
        </h2>

        {/* Badge - MOBILANPASSAD */}
        {futureMatches.length > 0 && (
          <div 
            onClick={handleBadgeClick}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: isMobile ? '10px 16px' : '8px 16px',
              borderRadius: '12px',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              userSelect: 'none',
              minHeight: '44px', // Touch-friendly
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onTouchStart={(e) => {
              e.target.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
          >
            {showAll ? 'Visa färre' : `${futureMatches.length} matcher`}
          </div>
        )}
      </div>

      {/* Lista över matcher - MOBILANPASSAD */}
      {futureMatches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '32px 16px' : '48px',
          color: '#6b7280',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '2px dashed #cbd5e0'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            color: '#374151',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600'
          }}>
            Inga kommande matcher
          </h3>
          <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px' }}>
            Du har inga tilldelade matcher framöver.
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '12px' : '12px' 
        }}>
          {matchesToShow.map(assignment => (
            <div
              key={assignment.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '16px' : '20px',
                background: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: isSmallMobile ? 'column' : 'row',
                gap: isMobile ? '16px' : '20px',
                alignItems: isSmallMobile ? 'stretch' : 'center'
              }}>
                {/* Match Info */}
                <div style={{ flex: '1 1 auto' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 
                      onClick={() => handleMatchClick(assignment.match)}
                      style={{ 
                        margin: 0, 
                        fontSize: isMobile ? '16px' : '18px', 
                        fontWeight: '700',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        lineHeight: '1.3'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#dc2626'
                        e.target.style.textDecorationColor = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = '#ef4444'
                        e.target.style.textDecorationColor = 'transparent'
                      }}
                    >
                      {isSmallMobile ? assignment.match?.opponent : `IF Troja-Ljungby - ${assignment.match?.opponent || 'Okänd motståndare'}`} 👥
                    </h3>
                  </div>
                  
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: isMobile ? '13px' : '14px',
                    marginBottom: '12px',
                    fontWeight: '500',
                    lineHeight: '1.4'
                  }}>
                    {formatDate(assignment.match?.date)} • {assignment.match?.time || 'TBA'} • 
                    {assignment.match?.match_type === 'away' ? ' Borta' : ' Hemma'}
                  </div>
                  
                  {assignment.hasWorkHours && assignment.workHours && (
                    <div style={{
                      background: '#d1fae5',
                      border: '1px solid #10b981',
                      padding: isMobile ? '8px 12px' : '12px',
                      borderRadius: '8px',
                      fontSize: isMobile ? '13px' : '14px',
                      marginBottom: isSmallMobile ? '12px' : '0'
                    }}>
                      <strong>Arbetstider:</strong> {formatTime(assignment.workHours.start_time)} - {formatTime(assignment.workHours.end_time)} 
                      ({assignment.workHours.total_hours}h)
                    </div>
                  )}
                </div>

                {/* Action Button - MOBILANPASSAD */}
                <button
                  onClick={() => onEditTimes(assignment)}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: isMobile ? '14px 20px' : '12px 20px',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: isMobile ? '100%' : '110px',
                    minHeight: '44px', // Touch-friendly
                    flex: isSmallMobile ? '0 0 auto' : '0 0 110px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  onTouchStart={(e) => {
                    e.target.style.transform = 'scale(0.98)'
                  }}
                  onTouchEnd={(e) => {
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  {assignment.hasWorkHours ? 'Ändra' : 'Sätt tider'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Personnel Modal - MOBILANPASSAD */}
      {showPersonnelModal && selectedMatch && (
        <MatchPersonnelModal
          match={selectedMatch}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default AssignedMatches