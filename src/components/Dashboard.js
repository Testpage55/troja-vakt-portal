import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import TodaysMatch from './TodaysMatch'
import TimeRegistration from './TimeRegistration'
import MyHours from './MyHours'

function Dashboard({ guard, onLogout }) {
  const [todaysMatch, setTodaysMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaysMatch()
  }, [guard.id])

  const fetchTodaysMatch = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          assignments!inner(personnel_id, is_working)
        `)
        .eq('date', today)
        .eq('assignments.personnel_id', guard.id)
        .eq('assignments.is_working', true)
        .single()
      
      setTodaysMatch(data)
    } catch (error) {
      console.log('Ingen match idag')
      setTodaysMatch(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Välkommen {guard.name}</h1>
        <button onClick={onLogout} className="logout-btn">
          Logga ut
        </button>
      </header>

      <main className="dashboard-content">
        <TodaysMatch match={todaysMatch} guard={guard} />
        <TimeRegistration match={todaysMatch} guard={guard} />
        <MyHours guard={guard} />
      </main>
    </div>
  )
}

export default Dashboard