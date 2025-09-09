// 📋 FILNAMN: src/components/AssignedMatches.js
// 📄 ÅTGÄRD: ERSÄTT din befintliga AssignedMatches.js med denna version

import { useState } from 'react'
import MatchPersonnelModal from './MatchPersonnelModal'

function AssignedMatches({ assignments, onEditTimes }) {
  const [showAll, setShowAll] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showPersonnelModal, setShowPersonnelModal] = useState(false)

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

  const getStatusBadge = (assignment) => {
    if (!assignment.match) {
      return { 
        text: 'Okänd status', 
        color: '#6b7280', 
        bg: '#f3f4f6',
        priority: 4
      }
    }

    const { match, hasWorkHours } = assignment
    const matchDate = new Date(match.date)
    const today = new Date()
    
    if (matchDate < today) {
      return { 
        text: 'Genomförd', 
        color: '#065f46', 
        bg: '#d1fae5',
        priority: 3
      }
    } else if (hasWorkHours) {
      return { 
        text: 'Tider satta', 
        color: '#1e40af', 
        bg: '#dbeafe',
        priority: 2
      }
    } else {
      return { 
        text: 'Behöver tider', 
        color: '#92400e', 
        bg: '#fef3c7',
        priority: 1
      }
    }
  }

  const handleMatchClick = (match) => {
    setSelectedMatch(match)
    setShowPersonnelModal(true)
  }

  const handleCloseModal = () => {
    setShowPersonnelModal(false)
    setSelectedMatch(null)
  }

  // Filtrera endast kommande matcher
  const today = new Date()
  const upcomingAssignments = assignments.filter(assignment => {
    if (!assignment.match) return false
    return new Date(assignment.match.date) >= today
  })

  // Sortera: viktigast först (behöver tider), sedan datum
  const sortedAssignments = [...upcomingAssignments].sort((a, b) => {
    const statusA = getStatusBadge(a)
    const statusB = getStatusBadge(b)
    
    // Först sortera på prioritet (behöver tider först)
    if (statusA.priority !== statusB.priority) {
      return statusA.priority - statusB.priority
    }
    
    // Sedan sortera på datum
    return new Date(a.match.date) - new Date(b.match.date)
  })

  // Visa endast 3 matcher som standard
  const displayedAssignments = showAll ? sortedAssignments : sortedAssignments.slice(0, 3)
  const hasMoreMatches = sortedAssignments.length > 3

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '32px',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginBottom: '24px'
    }}>
      {/* Enkel header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Kommande Matcher
        </h2>
      </div>

      {/* Matches List */}
      {displayedAssignments.length === 0 ? (
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
            Inga kommande matcher
          </h3>
          <p style={{ margin: 0 }}>
            Du har inga schemalagda matcher framöver.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedAssignments.map(assignment => {
              const status = getStatusBadge(assignment)
              const isUrgent = status.priority === 1 // Behöver tider
              
              return (
                <div
                  key={assignment.id}
                  style={{
                    border: isUrgent ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '20px',
                    background: isUrgent 
                      ? 'linear-gradient(135deg, #fef3c7 0%, white 100%)'
                      : 'white',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Match Info */}
                    <div>
                      <div style={{
                        marginBottom: '8px'
                      }}>
                        <h3 
                          onClick={() => handleMatchClick(assignment.match)}
                          style={{ 
                            margin: 0, 
                            fontSize: '18px', 
                            fontWeight: '700',
                            color: '#ef4444',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textDecoration: 'underline',
                            textDecorationColor: 'transparent'
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
                          IF Troja-Ljungby - {assignment.match?.opponent || 'Okänd motståndare'} 👥
                        </h3>
                      </div>
                      
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        marginBottom: '12px',
                        fontWeight: '500'
                      }}>
                        {formatDate(assignment.match?.date)} • {assignment.match?.time || 'TBA'} •
                        {assignment.match?.match_type === 'away' ? ' Bortamatch' : ' Hemmamatch'}
                      </div>
                      
                      {assignment.hasWorkHours && assignment.workHours && (
                        <div style={{
                          background: '#d1fae5',
                          border: '1px solid #10b981',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}>
                          <strong>Arbetstider:</strong> {formatTime(assignment.workHours.start_time)} - {formatTime(assignment.workHours.end_time)} 
                          ({assignment.workHours.total_hours}h)
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onEditTimes(assignment)}
                      style={{
                        background: isUrgent 
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minWidth: '110px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      {assignment.hasWorkHours ? 'Ändra' : 'Sätt tider'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Expandera/Dölj knapp */}
          {hasMoreMatches && (
            <div style={{
              textAlign: 'center',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  background: 'transparent',
                  border: '2px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '12px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ef4444'
                  e.target.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#ef4444'
                }}
              >
                {showAll 
                  ? `Visa färre (${sortedAssignments.length - 3} dolda)`
                  : `Visa alla (${sortedAssignments.length - 3} till)`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Personnel Modal */}
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