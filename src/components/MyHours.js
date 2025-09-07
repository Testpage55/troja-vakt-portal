import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyHours({ guard }) {
  const [workHours, setWorkHours] = useState([])
  const [loading, setLoading] = useState(true)

  // Formatera tid till HH:MM (ta bort sekunder)
  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.split(':').slice(0, 2).join(':')
  }

  useEffect(() => {
    fetchMyHours()
  }, [guard.id])

  const fetchMyHours = async () => {
    setLoading(true)
    try {
      console.log('Hämtar arbetstider för guard:', guard.id) // Debug
      
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
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Hämtade arbetstider:', data) // Debug
      setWorkHours(data || [])
    } catch (error) {
      console.error('Error fetching work hours:', error)
      // Prova alternativ query om den första misslyckas
      try {
        console.log('Försöker alternativ query...')
        const { data: altData, error: altError } = await supabase
          .from('work_hours')
          .select('*')
          .eq('personnel_id', guard.id)
          .order('work_date', { ascending: false })
          .limit(20)
        
        if (altError) throw altError
        console.log('Alternativ query lyckades:', altData)
        setWorkHours(altData || [])
      } catch (altError) {
        console.error('Alternativ query misslyckades också:', altError)
        setWorkHours([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Lägg till en refresh-funktion som kan anropas från parent
  useEffect(() => {
    // Lyssna på window event för att uppdatera när nya timmar sparas
    const handleWorkHoursSaved = () => {
      console.log('Work hours saved event detected, refreshing...')
      fetchMyHours()
    }

    window.addEventListener('workHoursSaved', handleWorkHoursSaved)
    return () => window.removeEventListener('workHoursSaved', handleWorkHoursSaved)
  }, [])

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
                  {wh.start_time && wh.end_time ? `${formatTime(wh.start_time)} - ${formatTime(wh.end_time)}` : 'Tid ej angiven'}
                </div>
                
                {wh.notes && (
                  <div className="hours-notes">
                    {wh.notes}
                  </div>
                )}
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