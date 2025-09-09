// 📁 FILNAMN: src/components/TimeEditor.js
// ➕ ÅTGÄRD: SKAPA ny fil med detta innehåll

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Hjälpfunktion för att beräkna föreslagna arbetstider baserat på matchtid
const calculateSuggestedTimes = (matchTime) => {
  if (!matchTime || matchTime === 'TBA') {
    return { startTime: '17:00', endTime: '21:30' }
  }

  try {
    const [hours, minutes] = matchTime.split(':').map(Number)
    
    // Starttid: 2 timmar innan match, avrundat till närmaste kvart
    let startHour = hours - 2
    let startMinutes = Math.round(minutes / 15) * 15
    
    if (startMinutes >= 60) {
      startHour += 1
      startMinutes = 0
    }
    
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`
    
    // Sluttid: 2.5 timmar efter match, avrundat till närmaste kvart
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

function TimeEditor({ assignment, guard, onSave, onClose }) {
  const [editingHours, setEditingHours] = useState({
    start_time: '',
    end_time: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Sätt initiala värden
    if (assignment.hasWorkHours && assignment.workHours) {
      // Använd befintliga tider
      setEditingHours({
        start_time: assignment.workHours.start_time || '',
        end_time: assignment.workHours.end_time || '',
        notes: assignment.workHours.notes || ''
      })
    } else {
      // Föreslå tider baserat på matchtid
      const suggested = calculateSuggestedTimes(assignment.match?.time)
      setEditingHours({
        start_time: suggested.startTime,
        end_time: suggested.endTime,
        notes: ''
      })
    }
  }, [assignment])

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    if (end > start) {
      const diffMs = end - start
      return (diffMs / (1000 * 60 * 60)).toFixed(1)
    }
    return 0
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Inget datum'
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleInputChange = (field, value) => {
    setEditingHours(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!editingHours.start_time || !editingHours.end_time) {
      alert('Du måste ange både start- och sluttid')
      return
    }

    if (!assignment.match) {
      alert('Ingen match-information finns tillgänglig')
      return
    }

    setSaving(true)

    try {
      const workData = {
        match_id: assignment.match.id,
        personnel_id: guard.id,
        start_time: editingHours.start_time,
        end_time: editingHours.end_time,
        work_date: assignment.match.date,
        notes: editingHours.notes.trim() || null
      }

      let result
      if (assignment.hasWorkHours && assignment.workHours?.id) {
        // Uppdatera befintliga arbetstider
        result = await supabase
          .from('work_hours')
          .update(workData)
          .eq('id', assignment.workHours.id)
          .select()
      } else {
        // Skapa nya arbetstider
        result = await supabase
          .from('work_hours')
          .insert([workData])
          .select()
      }

      if (result.error) {
        throw result.error
      }

      console.log('Arbetstider sparade:', result.data)
      alert('Arbetstider sparade!')
      
      // Trigga callback för att uppdatera parent component
      onSave()
    } catch (error) {
      console.error('Fel vid sparande:', error)
      alert('Fel vid sparande: ' + (error.message || 'Okänt fel'))
    } finally {
      setSaving(false)
    }
  }

  const handleUseSuggested = () => {
    if (!assignment.match?.time) return
    
    const suggested = calculateSuggestedTimes(assignment.match.time)
    setEditingHours(prev => ({
      ...prev,
      start_time: suggested.startTime,
      end_time: suggested.endTime
    }))
  }

  const totalHours = calculateHours(editingHours.start_time, editingHours.end_time)
  const isStandardHours = totalHours == 4.5

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#6b7280',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e2e8f0'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f1f5f9'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {assignment.hasWorkHours ? 'Ändra arbetstider' : 'Sätt arbetstider'}
          </h3>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '16px'
          }}>
            {assignment.hasWorkHours ? 'Uppdatera dina arbetstider för matchen' : 'Välj arbetstider för din tilldelade match'}
          </p>
        </div>
        
        {/* Match Info Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
            {assignment.match?.opponent || 'Okänd motståndare'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {formatDate(assignment.match?.date)} • {assignment.match?.time || 'TBA'} • 
            {assignment.match?.match_type === 'away' ? ' Bortamatch' : ' Hemmamatch'}
            {assignment.match?.distance_miles && ` • ${assignment.match.distance_miles} mil`}
          </div>
        </div>

        {/* Suggested Times Button */}
        {assignment.match?.time && assignment.match.time !== 'TBA' && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <button
              onClick={handleUseSuggested}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e2e8f0'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f1f5f9'
              }}
            >
              💡 Använd föreslagna tider (baserat på matchtid)
            </button>
          </div>
        )}
        
        {/* Time Inputs */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px',
          marginBottom: '24px' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Starttid
            </label>
            <input
              type="time"
              value={editingHours.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ef4444'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Sluttid
            </label>
            <input
              type="time"
              value={editingHours.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ef4444'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
              }}
            />
          </div>
        </div>
        
        {/* Hours Calculation */}
        <div style={{
          background: isStandardHours ? '#d1fae5' : '#fef3c7',
          border: `1px solid ${isStandardHours ? '#10b981' : '#f59e0b'}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '20px', 
            color: isStandardHours ? '#065f46' : '#92400e',
            marginBottom: '8px'
          }}>
            Totalt: {totalHours} timmar
          </div>
          {!isStandardHours && (
            <div style={{ 
              fontSize: '14px', 
              color: '#92400e',
              fontWeight: '500'
            }}>
              Avviker från standard (4.5h)
            </div>
          )}
        </div>
        
        {/* Notes */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600',
            color: '#374151',
            fontSize: '14px'
          }}>
            Anteckningar (valfritt)
          </label>
          <textarea
            value={editingHours.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="T.ex. övertid, extratid, särskilda förhållanden..."
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ef4444'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb'
            }}
          />
        </div>
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '16px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e2e8f0'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f1f5f9'
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editingHours.start_time || !editingHours.end_time}
            style={{
              background: saving ? '#d1d5db' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!saving && !e.target.disabled) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !e.target.disabled) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }
            }}
          >
            {saving && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {saving ? 'Sparar...' : (assignment.hasWorkHours ? 'Uppdatera tider' : 'Spara tider')}
          </button>
        </div>
      </div>

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

export default TimeEditor