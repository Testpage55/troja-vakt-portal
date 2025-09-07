import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyHours({ guard, onEditWorkHour }) {
  const [workHours, setWorkHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchMyHours()
  }, [guard.id])

  const fetchMyHours = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_hours')
        .select(`
          *,
          matches (
            date,
            opponent,
            time
          )
        `)
        .eq('personnel_id', guard.id)
        .order('work_date', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setWorkHours(data || [])
    } catch (error) {
      console.error('Error fetching work hours:', error)
      try {
        const { data: altData, error: altError } = await supabase
          .from('work_hours')
          .select('*')
          .eq('personnel_id', guard.id)
          .order('work_date', { ascending: false })
          .limit(20)
        
        if (altError) throw altError
        setWorkHours(altData || [])
      } catch (altError) {
        console.error('Alt query failed:', altError)
        setWorkHours([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Lyssna på uppdateringar
  useEffect(() => {
    const handleWorkHoursSaved = () => {
      fetchMyHours()
    }

    window.addEventListener('workHoursSaved', handleWorkHoursSaved)
    return () => window.removeEventListener('workHoursSaved', handleWorkHoursSaved)
  }, [])

  const handleEdit = (workHour) => {
    if (onEditWorkHour) {
      onEditWorkHour(workHour)
    }
  }

  const handleDelete = async (workHourId) => {
    const workHour = workHours.find(wh => wh.id === workHourId)
    const opponent = workHour?.matches?.opponent || 'detta pass'
    
    const confirmed = window.confirm(
      `Är du säker på att du vill ta bort arbetstiden för ${opponent}?`
    )
    
    if (!confirmed) return

    setDeleting(workHourId)
    try {
      const { error } = await supabase
        .from('work_hours')
        .delete()
        .eq('id', workHourId)
        .eq('personnel_id', guard.id)

      if (error) throw error

      setWorkHours(prev => prev.filter(wh => wh.id !== workHourId))
      alert('Arbetstid borttagen!')
      
    } catch (error) {
      console.error('Error deleting work hours:', error)
      alert('Fel vid borttagning: ' + (error.message || 'Okänt fel'))
    } finally {
      setDeleting(null)
    }
  }

  const totalHours = workHours.reduce((sum, wh) => {
    const hours = wh.total_hours || 0
    return sum + parseFloat(hours)
  }, 0)

  if (loading) return <div className="loading">Laddar dina timmar...</div>

  return (
    <div className="my-hours">
      <h2>Dina arbetstider</h2>
      
      <div className="hours-summary">
        <p>Totalt denna säsong: {totalHours.toFixed(1)} timmar</p>
        <p>Antal pass: {workHours.length}</p>
      </div>

      <div className="hours-list">
        <h3>Senaste registreringar</h3>
        {workHours.length === 0 ? (
          <div className="no-hours-message">
            <p>Inga arbetstider registrerade än.</p>
            <button 
              onClick={fetchMyHours}
              className="refresh-button"
            >
              Uppdatera
            </button>
          </div>
        ) : (
          <div className="hours-table">
            {workHours.map(wh => (
              <div key={wh.id} className="hours-row">
                <div className="hours-row-header">
                  <div className="hours-date">
                    {wh.work_date ? new Date(wh.work_date).toLocaleDateString('sv-SE') : 'Inget datum'}
                  </div>
                  <div className="hours-total">
                    {wh.total_hours ? parseFloat(wh.total_hours).toFixed(1) : '0'}h
                  </div>
                </div>
                
                <div className="hours-match">
                  {wh.matches?.opponent || 'Annat uppdrag'}
                  {wh.matches?.date && (
                    <div style={{ fontSize: '0.8em', color: 'var(--gray-500)' }}>
                      Match: {new Date(wh.matches.date).toLocaleDateString('sv-SE')}
                    </div>
                  )}
                </div>
                
                <div className="hours-time">
                  {wh.start_time && wh.end_time ? 
                    `${wh.start_time.split(':').slice(0, 2).join(':')} - ${wh.end_time.split(':').slice(0, 2).join(':')}` : 
                    'Tid ej angiven'
                  }
                </div>
                
                {wh.notes && (
                  <div className="hours-notes">
                    {wh.notes}
                  </div>
                )}

                {/* Delete button - snygg kryss-knapp */}
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="btn-delete-small"
                  disabled={deleting === wh.id}
                  title="Ta bort arbetstid"
                >
                  {deleting === wh.id ? '⏳' : '✕'}
                </button>
              </div>
            ))}
            <button 
              onClick={fetchMyHours}
              className="refresh-button"
            >
              Uppdatera lista
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyHours