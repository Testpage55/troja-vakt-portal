// 📁 FILNAMN: src/components/Dashboard.js
// 🔄 ÅTGÄRD: ERSÄTT din befintliga Dashboard.js med denna ENKLA version

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import NextMatch from './NextMatch'
import AssignedMatches from './AssignedMatches'
import TimeEditor from './TimeEditor'
import MyHours from './MyHours'

function Dashboard({ guard, onLogout }) {
  const [assignedMatches, setAssignedMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    fetchAssignedMatches()
  }, [guard.id])

  const fetchAssignedMatches = async () => {
    try {
      // Försök hämta tilldelade matcher
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          matches(*),
          work_hours(*)
        `)
        .eq('personnel_id', guard.id)
        .eq('is_working', true)

      if (error) {
        console.log('Assignments error:', error)
        throw error
      }

      const formattedAssignments = (assignments || []).map(assignment => ({
        id: assignment.id,
        match: assignment.matches,
        workHours: assignment.work_hours?.[0] || null,
        hasWorkHours: assignment.work_hours?.length > 0
      }))

      formattedAssignments.sort((a, b) => new Date(a.match?.date || 0) - new Date(b.match?.date || 0))
      setAssignedMatches(formattedAssignments)

    } catch (error) {
      console.error('Error fetching assignments, trying fallback:', error)
      
      // Fallback: Visa bara arbetstider
      try {
        const { data: workHours, error: whError } = await supabase
          .from('work_hours')
          .select(`
            *,
            matches(*)
          `)
          .eq('personnel_id', guard.id)
          .order('work_date', { ascending: false })
          .limit(5)

        if (whError) throw whError

        const fallbackAssignments = (workHours || []).map(wh => ({
          id: wh.id,
          match: wh.matches,
          workHours: wh,
          hasWorkHours: true
        }))

        setAssignedMatches(fallbackAssignments)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setAssignedMatches([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditTimes = (assignment) => {
    setSelectedAssignment(assignment)
    setShowTimeEditor(true)
  }

  const handleTimesSaved = () => {
    fetchAssignedMatches()
    setShowTimeEditor(false)
    setSelectedAssignment(null)
  }

  const handleCloseTimeEditor = () => {
    setShowTimeEditor(false)
    setSelectedAssignment(null)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Laddar dashboard...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '800px',
        margin: '0 auto 24px auto',
        padding: '16px 24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
          color: '#ef4444'
        }}>
          Välkommen {guard.name}
        </h1>
        <button 
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logga ut
        </button>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* NextMatch komponent */}
        <NextMatch guard={guard} />
        
        {/* AssignedMatches komponent */}
        <AssignedMatches 
          assignments={assignedMatches}
          onEditTimes={handleEditTimes}
        />

        {/* MyHours komponent */}
        <MyHours guard={guard} />
      </div>

      {/* TimeEditor Modal */}
      {showTimeEditor && selectedAssignment && (
        <TimeEditor
          assignment={selectedAssignment}
          guard={guard}
          onSave={handleTimesSaved}
          onClose={handleCloseTimeEditor}
        />
      )}
    </div>
  )
}

export default Dashboard