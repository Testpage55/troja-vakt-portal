import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Importera samma funktion som admin-appen använder
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

// Förbättrad funktion för att beräkna arbetstimmar
const calculateWorkHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0
  
  try {
    // Normalisera tid till HH:MM format
    const normalizeTime = (timeStr) => {
      if (!timeStr) return null
      const parts = timeStr.split(':')
      return `${parts[0]}:${parts[1] || '00'}`
    }
    
    const normalizedStart = normalizeTime(startTime)
    const normalizedEnd = normalizeTime(endTime)
    
    if (!normalizedStart || !normalizedEnd) return 0
    
    const today = new Date().toISOString().split('T')[0]
    const start = new Date(`${today}T${normalizedStart}:00`)
    const end = new Date(`${today}T${normalizedEnd}:00`)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0
    }
    
    if (end < start) {
      end.setDate(end.getDate() + 1)
    }
    
    const diffMs = end - start
    const hours = diffMs / (1000 * 60 * 60)
    const roundedHours = Math.round(hours * 4) / 4
    
    if (roundedHours < 0 || roundedHours > 24) {
      return 0
    }
    
    return roundedHours
  } catch (error) {
    return 0
  }
}

// Utility för att ta bort sekunder från tid
const removeSeconds = (timeString) => {
  if (!timeString) return ''
  const parts = timeString.split(':')
  return `${parts[0]}:${parts[1]}`
}

function TimeRegistration({ match, guard, onClose }) {
  const [allMatches, setAllMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingHours, setExistingHours] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)

  // Hämta alla matcher
  useEffect(() => {
    fetchAllMatches()
  }, [])

  // Hantera när dagens match ändras eller när en match väljs
  useEffect(() => {
    if (selectedMatchId) {
      const foundMatch = allMatches.find(m => m.id === parseInt(selectedMatchId))
      setSelectedMatch(foundMatch || null)
    } else if (match) {
      setSelectedMatch(match)
      setSelectedMatchId(match.id.toString())
    } else {
      setSelectedMatch(null)
    }
  }, [selectedMatchId, match, allMatches])

  // Uppdatera arbetstider när vald match ändras
  useEffect(() => {
    if (selectedMatch?.time) {
      const { startTime: autoStart, endTime: autoEnd } = calculateWorkTimes(selectedMatch.time)
      setStartTime(autoStart)
      setEndTime(autoEnd)
    }
    
    checkExistingHours()
  }, [selectedMatch, guard])

  const fetchAllMatches = async () => {
    try {
      setLoadingMatches(true)
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const ninetyDaysFromNow = new Date()
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('date', ninetyDaysFromNow.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      
      setAllMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
      setAllMatches([])
    } finally {
      setLoadingMatches(false)
    }
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
        // Ta bort sekunder från befintliga tider
        setStartTime(removeSeconds(data.start_time))
        setEndTime(removeSeconds(data.end_time))
        setNotes(data.notes || '')
      } else {
        setExistingHours(null)
        if (selectedMatch?.time) {
          const { startTime: autoStart, endTime: autoEnd } = calculateWorkTimes(selectedMatch.time)
          setStartTime(autoStart)
          setEndTime(autoEnd)
        }
        setNotes('')
      }
    } catch (error) {
      setExistingHours(null)
      setNotes('')
    }
  }

  const calculatedHours = calculateWorkHours(startTime, endTime)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (calculatedHours <= 0 || isNaN(calculatedHours)) {
        alert('Kontrollera att sluttid är efter starttid')
        setSaving(false)
        return
      }

      if (!selectedMatch && selectedMatchId !== 'other') {
        alert('Välj en match först')
        setSaving(false)
        return
      }

      const workData = {
        match_id: selectedMatchId === 'other' ? null : selectedMatch?.id,
        personnel_id: guard.id,
        start_time: startTime,
        end_time: endTime,
        work_date: selectedMatch?.date || existingHours?.work_date || new Date().toISOString().split('T')[0],
        notes: notes.trim()
      }

      if (existingHours) {
        const { error } = await supabase
          .from('work_hours')
          .update(workData)
          .eq('id', existingHours.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('work_hours')
          .insert([workData])
        
        if (error) throw error
      }

      alert(`Arbetstid sparad! (${calculatedHours} timmar)`)
      
      window.dispatchEvent(new Event('workHoursSaved'))
      
      if (onClose) {
        setTimeout(() => onClose(), 1000)
      }
      
      checkExistingHours()
    } catch (error) {
      console.error('Error saving work hours:', error)
      alert('Fel vid sparande: ' + (error.message || 'Okänt fel'))
    } finally {
      setSaving(false)
    }
  }

  const isNonStandardHours = calculatedHours !== 4.5

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'IDAG'
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'IMORGON'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'IGÅR'
    } else {
      return date.toLocaleDateString('sv-SE', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  return (
    <div className="time-registration">
      <h2>Registrera arbetstid</h2>
      
      {selectedMatch && (
        <div className="match-info-card">
          <h3>{guard.name}</h3>
          <h3>{selectedMatch.opponent}</h3>
          <div className="match-details">
            <div>{formatDate(selectedMatch.date)}</div>
            <div>Match: {selectedMatch.time || 'TBA'}</div>
          </div>
        </div>
      )}

      <div className="standard-hours-info">
        <h4>Standard: 4,5 timmar</h4>
        <p>Start 2h före match • Slut 2,5h efter matchstart</p>
        <p>Justera tiderna nedan om avvikelse behövs</p>
      </div>

      <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--gray-100)' }}>
        <label style={{ 
          display: 'block',
          fontWeight: '500',
          color: 'var(--gray-700)',
          fontSize: '1rem',
          marginBottom: 'var(--space-sm)'
        }}>
          Välj match:
        </label>
        {loadingMatches ? (
          <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
            Laddar matcher...
          </div>
        ) : (
          <select 
            value={selectedMatchId} 
            onChange={(e) => setSelectedMatchId(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-lg)',
              border: '2px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              background: 'white',
              minHeight: 'var(--touch-target)'
            }}
          >
            <option value="">Välj en match...</option>
            {allMatches.map(m => (
              <option key={m.id} value={m.id}>
                {formatDate(m.date)} - {m.opponent} ({m.time || 'TBA'})
              </option>
            ))}
            <option value="other">Annat uppdrag (ingen specifik match)</option>
          </select>
        )}
      </div>

      {existingHours && (
        <div className="existing-notice">
          Arbetstid redan registrerad ({existingHours.total_hours}h) - du kan uppdatera den här.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="time-inputs">
          <div className="time-input-group">
            <label>Starttid</label>
            <div 
              className="time-input-button" 
              onClick={() => {
                const input = document.getElementById('start-time')
                if (input && input.showPicker) {
                  input.showPicker()
                } else {
                  input.focus()
                }
              }}
            >
              {startTime || '00:00'}
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
            </div>
          </div>

          <div className="time-input-group">
            <label>Sluttid</label>
            <div 
              className="time-input-button" 
              onClick={() => {
                const input = document.getElementById('end-time')
                if (input && input.showPicker) {
                  input.showPicker()
                } else {
                  input.focus()
                }
              }}
            >
              {endTime || '00:00'}
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="calculated-hours-display">
          <div className="hours-badge">
            {calculatedHours > 0 && !isNaN(calculatedHours) ? calculatedHours : '0'}
            <div className="hours-label">timmar</div>
          </div>
          {isNonStandardHours && calculatedHours > 0 && !isNaN(calculatedHours) && (
            <span className="deviation">
              (avviker från standard 4.5h)
            </span>
          )}
          {(calculatedHours <= 0 || isNaN(calculatedHours)) && startTime && endTime && (
            <span className="deviation">
              Kontrollera tiderna
            </span>
          )}
        </div>

        <div className="notes-section">
          <label>Anteckningar (valfritt)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="T.ex. Övertid, paus, extratid..."
          />
        </div>

        <div className="action-buttons">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => {
              if (onClose) {
                onClose()
              } else {
                setStartTime('')
                setEndTime('')
                setNotes('')
                setSelectedMatchId('')
              }
            }}
          >
            Avbryt
          </button>
          <button 
            type="submit" 
            className="btn-save"
            disabled={saving || !startTime || !endTime || calculatedHours <= 0 || isNaN(calculatedHours) || (!selectedMatch && selectedMatchId !== 'other')}
          >
            {saving ? 'Sparar...' : `Spara ${calculatedHours > 0 && !isNaN(calculatedHours) ? calculatedHours : ''}h`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TimeRegistration