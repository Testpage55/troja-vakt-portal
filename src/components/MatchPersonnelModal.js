// 📋 FILNAMN: src/components/MatchPersonnelModal.js
// 📄 ÅTGÄRD: ERSÄTT din befintliga MatchPersonnelModal.js med denna Portal-version

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'

function MatchPersonnelModal({ match, onClose }) {
  const [personnel, setPersonnel] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (match) {
      fetchMatchPersonnel()
    }
  }, [match])

  const fetchMatchPersonnel = async () => {
    try {
      console.log('🔍 Fetching personnel for match:', match.id, match)
      
      // Strategi 1: Försök med assignments-tabellen
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          personnel(*),
          work_hours(*)
        `)
        .eq('match_id', match.id)
      
      console.log('📋 Raw assignments data:', assignments)
      console.log('❌ Assignments error:', assignmentsError)

      let formattedPersonnel = []

      if (assignments && assignments.length > 0) {
        // Formatera assignments data
        formattedPersonnel = assignments
          .filter(assignment => assignment.personnel) // Ta bara de som har personnel-data
          .map(assignment => ({
            id: assignment.personnel.id,
            name: assignment.personnel.name,
            role: assignment.personnel.role || 'Vakt',
            phone: assignment.personnel.phone,
            workHours: assignment.work_hours?.[0] || null,
            hasWorkHours: assignment.work_hours?.length > 0,
            assignment: assignment
          }))
        
        console.log('✅ Formatted from assignments:', formattedPersonnel)
      } else {
        // Strategi 2: Om assignments inte fungerar, försök med work_hours direkt
        console.log('🔄 Trying work_hours fallback...')
        
        const { data: workHours, error: workHoursError } = await supabase
          .from('work_hours')
          .select(`
            *,
            personnel(*)
          `)
          .eq('match_id', match.id)
        
        console.log('⏰ Work hours data:', workHours)
        console.log('❌ Work hours error:', workHoursError)

        if (workHours && workHours.length > 0) {
          formattedPersonnel = workHours
            .filter(wh => wh.personnel)
            .map(wh => ({
              id: wh.personnel.id,
              name: wh.personnel.name,
              role: wh.personnel.role || 'Vakt',
              phone: wh.personnel.phone,
              workHours: wh,
              hasWorkHours: true,
              assignment: null
            }))
          
          console.log('✅ Formatted from work_hours:', formattedPersonnel)
        }
      }

      // Strategi 3: Om fortfarande tomt, kolla om det finns några kopplingar alls
      if (formattedPersonnel.length === 0) {
        console.log('🔄 Checking for any match references...')
        
        // Kolla om match.id finns i work_hours
        const { data: anyWorkHours } = await supabase
          .from('work_hours')
          .select('*')
          .eq('match_id', match.id)
        
        console.log('🔍 Any work_hours with this match_id:', anyWorkHours)
        
        // Kolla om match.id finns i assignments
        const { data: anyAssignments } = await supabase
          .from('assignments')
          .select('*')
          .eq('match_id', match.id)
        
        console.log('🔍 Any assignments with this match_id:', anyAssignments)
      }

      // Sortera: de som har arbetstider först, sedan alfabetiskt
      formattedPersonnel.sort((a, b) => {
        if (a.hasWorkHours && !b.hasWorkHours) return -1
        if (!a.hasWorkHours && b.hasWorkHours) return 1
        return a.name.localeCompare(b.name, 'sv-SE')
      })

      console.log('🎯 Final personnel list:', formattedPersonnel)
      setPersonnel(formattedPersonnel)
    } catch (error) {
      console.error('💥 Error fetching match personnel:', error)
      setPersonnel([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
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

  if (!match) return null

  // Använd createPortal för att rendera utanför normal DOM-hierarki
  return createPortal(
    <div 
      style={{
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
        zIndex: 999999,
        padding: '24px'
      }}
      onClick={(e) => {
        // Stäng modal om man klickar på backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 1000000
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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
            transition: 'all 0.3s ease',
            zIndex: 1000001
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
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: '700'
            }}>
              IF Troja-Ljungby - {match.opponent}
            </h2>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>
              {formatDate(match.date)} • {match.time || 'TBA'} • 
              {match.match_type === 'away' ? ' Bortamatch' : ' Hemmamatch'}
            </div>
          </div>

          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            Vakter som jobbar ({personnel.length})
          </h3>
        </div>

        {/* Personnel List */}
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '48px',
            fontSize: '18px',
            color: '#6b7280'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #ef4444',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Laddar vakter...
          </div>
        ) : personnel.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#6b7280',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '2px dashed #cbd5e0'
          }}>
            <h4 style={{
              margin: '0 0 16px 0',
              color: '#374151',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Inga vakter tilldelade
            </h4>
            <p style={{ margin: 0 }}>
              Ingen personal har tilldelats denna match än.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {personnel.map(person => (
              <div
                key={person.id}
                style={{
                  background: person.hasWorkHours ? '#f8fafc' : '#fef3c7',
                  border: person.hasWorkHours ? '1px solid #e2e8f0' : '2px solid #f59e0b',
                  borderRadius: '16px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = person.hasWorkHours ? 'white' : '#fef3c7'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = person.hasWorkHours ? '#f8fafc' : '#fef3c7'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  {/* Person Info */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: '700',
                        color: '#1f2937'
                      }}>
                        {person.name}
                      </h4>
                      <span style={{
                        background: '#e2e8f0',
                        color: '#475569',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {person.role}
                      </span>
                    </div>
                    
                    {person.phone && (
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        📞 {person.phone}
                      </div>
                    )}

                    {person.hasWorkHours && person.workHours ? (
                      <div style={{
                        background: '#d1fae5',
                        border: '1px solid #10b981',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        display: 'inline-block'
                      }}>
                        <strong>Arbetstider:</strong> {formatTime(person.workHours.start_time)} - {formatTime(person.workHours.end_time)} 
                        ({person.workHours.total_hours}h)
                      </div>
                    ) : (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#92400e',
                        display: 'inline-block'
                      }}>
                        ⚠️ Arbetstider inte satta
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: person.hasWorkHours ? '#10b981' : '#f59e0b'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && personnel.length > 0 && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <strong>Sammanfattning:</strong> {personnel.filter(p => p.hasWorkHours).length} av {personnel.length} vakter har satt arbetstider
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>,
    document.body // Rendera direkt under body-elementet
  )
}

export default MatchPersonnelModal