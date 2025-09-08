// TimeRegistration.js - Ersätt din befintliga TimeRegistration.js med denna kod

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const calculateWorkTimes = (matchTime) => {
  if (!matchTime || matchTime === 'TBA') {
    return { startTime: '17:00', endTime: '21:30' }
  }

  try {
    const [hours, minutes] = matchTime.split(':').map(Number)
    
    let startHour = hours - 2
    let startMinutes = minutes
    
    startMinutes = Math.round(startMinutes / 15) * 15
    if (startMinutes >= 60) {
      startHour += 1
      startMinutes = 0
    }
    
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`
    
    let endHour = hours + 2
    let endMinutes = minutes + 30
    
    endMinutes = Math.round(endMinutes / 15) * 15
    if (endMinutes >= 60) {
      endHour += 1
      endMinutes -= 60
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    
    return { startTime, endTime }
  } catch (error) {
    return { startTime: '17:00', endTime: '21:30' }
  }
}

function TimeRegistration({ match: todaysMatch, guard, editingWorkHour, onClose }) {
  const [availableMatches, setAvailableMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingHours, setExistingHours] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [isAssigned, setIsAssigned] = useState(false)

  useEffect(() => {
    fetchAllMatches()
  }, [guard])

  useEffect(() => {
    if (editingWorkHour) {
      // Ladda befintlig arbetstid för redigering
      setSelectedMatchId(editingWorkHour.match_id?.toString() || '')
      setStartTime(editingWorkHour.start_time || '')
      setEndTime(editingWorkHour.end_time || '')
      setNotes(editingWorkHour.notes || '')
      setExistingHours(editingWorkHour)
      
      // Hitta motsvarande match
      if (editingWorkHour.match_id) {
        const match = availableMatches.find(m => m.id === editingWorkHour.match_id)
        if (match) {
          setSelectedMatch(match)
        }
      }
    } else if (todaysMatch && availableMatches.length > 0) {
      setSelectedMatchId(todaysMatch.id.toString())
      setSelectedMatch(todaysMatch)
    }
  }, [todaysMatch, availableMatches, editingWorkHour])

  useEffect(() => {
    if (selectedMatch?.time && !editingWorkHour) {
      const { startTime: autoStart, endTime: autoEnd } = calculateWorkTimes(selectedMatch.time)
      setStartTime(autoStart)
      setEndTime(autoEnd)
    }
    
    if (!editingWorkHour) {
      checkExistingHours()
    }
    checkAssignment()
  }, [selectedMatch, guard, editingWorkHour])

  const fetchAllMatches = async () => {
    try {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: false })
      
      const sortedMatches = sortMatchesByProximity(data || [])
      setAvailableMatches(sortedMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const checkAssignment = async () => {
    if (!selectedMatch) return
    
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .eq('personnel_id', guard.id)
        .single()
      
      setIsAssigned(data?.is_working || false)
    } catch (error) {
      setIsAssigned(false)
    }
  }

  const sortMatchesByProximity = (matches) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return matches.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      
      const distanceA = Math.abs(dateA - today)
      const distanceB = Math.abs(dateB - today)
      
      if (distanceA !== distanceB) {
        return distanceA - distanceB
      }
      
      return dateB - dateA
    })
  }

  const handleMatchChange = (e) => {
    const matchId = e.target.value
    setSelectedMatchId(matchId)
    
    if (matchId) {
      const match = availableMatches.find(m => m.id.toString() === matchId)
      setSelectedMatch(match)
    } else {
      setSelectedMatch(null)
    }
    
    if (!editingWorkHour) {
      setExistingHours(null)
      setNotes('')
    }
    setIsAssigned(false)
  }

  const checkExistingHours = async () => {
    if (!selectedMatch) return
    
    try {
      const { data } = await supabase
        .from('work_hours')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .eq('personnel_id', guard.id)
        .single()
      
      if (data) {
        setExistingHours(data)
        setStartTime(data.start_time)
        setEndTime(data.end_time)
        setNotes(data.notes || '')
      }
    } catch (error) {
      setExistingHours(null)
    }
  }

  const calculateHours = () => {
    if (!startTime || !endTime) return 0
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    if (end > start) {
      const diffMs = end - start
      return (diffMs / (1000 * 60 * 60)).toFixed(1)
    }
    return 0
  }

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    const tomorrow = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = date.toLocaleDateString('sv-SE')
    const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' })
    
    if (date.toDateString() === today.toDateString()) {
      return `${dateStr} (IDAG - ${dayName})`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${dateStr} (IGÅR - ${dayName})`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `${dateStr} (IMORGON - ${dayName})`
    }
    
    return `${dateStr} (${dayName})`
  }

  const groupMatches = (matches) => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    const sevenDaysFromNow = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    sevenDaysFromNow.setDate(today.getDate() + 7)
    
    const nearMatches = []
    const otherMatches = []
    
    matches.forEach(match => {
      const matchDate = new Date(match.date)
      if (matchDate >= sevenDaysAgo && matchDate <= sevenDaysFromNow) {
        nearMatches.push(match)
      } else {
        otherMatches.push(match)
      }
    })
    
    return { nearMatches, otherMatches }
  }

  const ensureAssignment = async () => {
    try {
      const { data: existing } = await supabase
        .from('assignments')
        .select('*')
        .eq('match_id', selectedMatch.id)
        .eq('personnel_id', guard.id)
        .single()

      if (!existing) {
        await supabase
          .from('assignments')
          .insert([{
            match_id: selectedMatch.id,
            personnel_id: guard.id,
            is_working: true
          }])
      } else if (!existing.is_working) {
        await supabase
          .from('assignments')
          .update({ is_working: true })
          .eq('id', existing.id)
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleSubmit = async () => {
    if (!startTime || !endTime) return
    
    setSaving(true)

    try {
      if (!editingWorkHour) {
        await ensureAssignment()
      }

      const workData = {
        match_id: selectedMatch?.id,
        personnel_id: guard.id,
        start_time: startTime,
        end_time: endTime,
        work_date: selectedMatch?.date || new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        registered_by: 'self'
      }

      if (existingHours || editingWorkHour) {
        const updateId = existingHours?.id || editingWorkHour?.id
        await supabase
          .from('work_hours')
          .update(workData)
          .eq('id', updateId)
      } else {
        await supabase
          .from('work_hours')
          .insert([workData])
      }

      alert('Arbetstid sparad!')
      
      // Trigger event för att uppdatera MyHours
      window.dispatchEvent(new CustomEvent('workHoursUpdated'))
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fel vid sparande: ' + (error.message || 'Okänt fel'))
    } finally {
      setSaving(false)
    }
  }

  const hours = calculateHours()

  if (loadingMatches) {
    return (
      <div className="time-registration-inner">
        <div className="loading">
          <div className="spinner"></div>
          Laddar matcher...
        </div>
      </div>
    )
  }

  return (
    <div className="time-registration-inner">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ 
          margin: '0 0 var(--space-sm) 0',
          color: 'var(--gray-800)',
          fontSize: '28px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)'
        }}>
          ⏰ {editingWorkHour ? 'Redigera' : 'Registrera'} Arbetstid
        </h2>
        <p style={{ 
          margin: 0,
          color: 'var(--gray-600)',
          fontSize: '16px'
        }}>
          Välkommen {guard.name}
        </p>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <div className="info-card-content">
          <h3>💡 Smart Registrering</h3>
          <p>
            {editingWorkHour 
              ? 'Redigera dina befintliga arbetstider här'
              : 'Välj en match så föreslår vi arbetstider automatiskt baserat på matchtid'
            }
          </p>
        </div>
      </div>
      
      {!editingWorkHour && (
        <div className="notice notice-info">
          <p>Du kan registrera arbetstid för vilken match som helst. Om du inte är förtilldelad kommer du automatiskt att läggas till som vakt.</p>
        </div>
      )}
      
      {/* Match Selector */}
      <div className="form-group">
        <label className="form-label">
          🏈 Välj Match
        </label>
        <select 
          value={selectedMatchId} 
          onChange={handleMatchChange}
          className="form-select"
          disabled={!!editingWorkHour}
        >
          <option value="">Välj match...</option>
          
          {(() => {
            const { nearMatches, otherMatches } = groupMatches(availableMatches)
            
            return (
              <>
                {nearMatches.length > 0 && (
                  <optgroup label="🔥 AKTUELLA MATCHER (senaste/kommande veckan)">
                    {nearMatches.map(match => (
                      <option key={match.id} value={match.id}>
                        {formatMatchDate(match.date)} - {match.opponent} ({match.time})
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {otherMatches.length > 0 && (
                  <optgroup label="📅 ÖVRIGA MATCHER">
                    {otherMatches.map(match => (
                      <option key={match.id} value={match.id}>
                        {formatMatchDate(match.date)} - {match.opponent} ({match.time})
                      </option>
                    ))}
                  </optgroup>
                )}
              </>
            )
          })()}
        </select>
      </div>

      {/* Selected Match Display */}
      {selectedMatch && (
        <div style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(255, 107, 107, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ margin: '0 0 var(--space-md) 0', fontSize: '24px', fontWeight: '700' }}>
              {selectedMatch.opponent}
            </h3>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              flexWrap: 'wrap', 
              gap: 'var(--space-md)',
              fontSize: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span>📅</span>
                <span>{formatMatchDate(selectedMatch.date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span>🕐</span>
                <span>{selectedMatch.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span>{selectedMatch.match_type === 'away' ? '✈️' : '🏠'}</span>
                <span>{selectedMatch.match_type === 'away' ? 'Bortamatch' : 'Hemmamatch'}</span>
              </div>
            </div>
            
            {!editingWorkHour && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                {isAssigned ? (
                  <span style={{
                    display: 'inline-block',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-xl)',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#15803d'
                  }}>
                    ✅ Du är tilldelad denna match
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-xl)',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#d97706'
                  }}>
                    ➕ Du kommer att läggas till som vakt
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(existingHours || editingWorkHour) && !editingWorkHour && (
        <div className="notice notice-warning">
          Arbetstid redan registrerad för denna match - du kan uppdatera den här.
        </div>
      )}

      {selectedMatch && (
        <div>
          {/* Time Inputs */}
          <div className="time-inputs">
            <div className="form-group">
              <label className="form-label">
                🚀 Starttid
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                🏁 Sluttid
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Hours Display */}
          <div className="calculated-hours">
            <h3>⏱️ Totalt: {hours} timmar</h3>
            {hours != 4.5 && (
              <p className="deviation">⚠️ Avviker från standard (4.5h)</p>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">
              📝 Anteckningar (valfritt)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="T.ex. övertid, extratid, kommentarer..."
              rows="4"
              className="form-textarea"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={saving || !startTime || !endTime}
            className="btn btn-primary btn-full"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Sparar...
              </>
            ) : (
              <>
                💾 {editingWorkHour ? 'Uppdatera' : 'Spara'} Arbetstid
              </>
            )}
          </button>
        </div>
      )}

      {availableMatches.length === 0 && (
        <div className="no-match">
          <h3>Inga matcher hittades</h3>
          <p>Det finns inga matcher att registrera arbetstid för just nu.</p>
        </div>
      )}
    </div>
  )
}

export default TimeRegistration