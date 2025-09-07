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
    // Skapa Date-objekt för samma dag
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    // Hantera fall där sluttid är nästa dag (efter midnatt)
    if (end < start) {
      end.setDate(end.getDate() + 1)
    }
    
    const diffMs = end - start
    const hours = diffMs / (1000 * 60 * 60)
    
    // Avrunda till närmaste kvart (0.25 timmar)
    return Math.round(hours * 4) / 4
  } catch (error) {
    console.error('Error calculating hours:', error)
    return 0
  }
}

function TimeRegistration({ match, guard }) {
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
      // Om det finns en dagens match, använd den som default
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
      
      // Hämta matcher från de senaste 30 dagarna till 90 dagar framåt
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
        setStartTime(data.start_time)
        setEndTime(data.end_time)
        setNotes(data.notes || '')
      } else {
        setExistingHours(null)
        // Återställ till automatiska tider om det inte finns befintliga timmar
        if (selectedMatch?.time) {
          const { startTime: autoStart, endTime: autoEnd } = calculateWorkTimes(selectedMatch.time)
          setStartTime(autoStart)
          setEndTime(autoEnd)
        }
        setNotes('')
      }
    } catch (error) {
      // Inga befintliga timmar
      setExistingHours(null)
      setNotes('')
    }
  }

  // Beräkna timmar med förbättrad logik
  const calculatedHours = calculateWorkHours(startTime, endTime)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Kontrollera att vi har giltiga tider
      if (calculatedHours <= 0) {
        alert('Kontrollera att sluttid är efter starttid')
        setSaving(false)
        return
      }

      if (!selectedMatch) {
        alert('Välj en match först')
        setSaving(false)
        return
      }

      const workData = {
        match_id: selectedMatch.id,
        personnel_id: guard.id,
        start_time: startTime,
        end_time: endTime,
        work_date: selectedMatch.date,
        notes: notes.trim()
      }

      if (existingHours) {
        // Uppdatera befintlig
        const { error } = await supabase
          .from('work_hours')
          .update(workData)
          .eq('id', existingHours.id)
        
        if (error) throw error
      } else {
        // Skapa ny
        const { error } = await supabase
          .from('work_hours')
          .insert([workData])
        
        if (error) throw error
      }

      alert(`Arbetstid sparad! (${calculatedHours} timmar)`)
      
      // Trigga uppdatering av MyHours komponenten
      window.dispatchEvent(new Event('workHoursSaved'))
      
      checkExistingHours() // Uppdatera status
    } catch (error) {
      console.error('Error saving work hours:', error)
      alert('Fel vid sparande: ' + (error.message || 'Okänt fel'))
    } finally {
      setSaving(false)
    }
  }

  // Kontrollera om timmarna avviker från standard
  const isNonStandardHours = calculatedHours !== 4.5

  // Formatera datum för visning
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
      
      {/* Match-väljare */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Välj match:
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
                padding: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                marginTop: '8px',
                background: 'white'
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
        </label>
      </div>

      {/* Visar vald match information */}
      {selectedMatch && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
          color: 'white',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3>{selectedMatch.opponent}</h3>
          <p>📅 {formatDate(selectedMatch.date)} • ⏰ {selectedMatch.time || 'TBA'}</p>
        </div>
      )}

      {/* Special handling för "Annat uppdrag" */}
      {selectedMatchId === 'other' && (
        <div style={{ 
          background: '#f1f5f9',
          padding: '15px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '2px solid #e2e8f0'
        }}>
          <p><strong>Annat uppdrag</strong></p>
          <p>Registrera arbetstid för uppdrag som inte är kopplat till en specifik match</p>
        </div>
      )}

      {existingHours && (
        <div className="existing-notice">
          Arbetstid redan registrerad ({existingHours.total_hours}h) - du kan uppdatera den här.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="time-inputs">
          <label>
            Starttid:
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>

          <label>
            Sluttid:
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="calculated-hours">
          <strong>Totalt: {calculatedHours} timmar</strong>
          {isNonStandardHours && (
            <span className="deviation">
              (avviker från standard 4.5h)
            </span>
          )}
        </div>

        <label>
          Anteckningar (valfritt):
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="T.ex. övertid, extratid, särskilda omständigheter..."
            rows="3"
          />
        </label>

        <button 
          type="submit" 
          disabled={saving || !startTime || !endTime || calculatedHours <= 0 || (!selectedMatch && selectedMatchId !== 'other')}
        >
          {saving ? 'Sparar...' : (existingHours ? 'Uppdatera' : 'Spara arbetstid')}
        </button>
        
        {calculatedHours <= 0 && startTime && endTime && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
            Kontrollera att sluttid är efter starttid
          </div>
        )}
      </form>
    </div>
  )
}

export default TimeRegistration