// 📋 FILNAMN: src/components/Dashboard.js
// 📄 ÅTGÄRD: ERSÄTT din befintliga Dashboard.js med denna MOBILANPASSADE version

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

  // Sätt sidtitel
  useEffect(() => {
    document.title = `Troja Vaktportal - ${guard.name}`
  }, [guard.name])

  useEffect(() => {
    fetchAssignedMatches()
  }, [guard.id])

  const fetchAssignedMatches = async () => {
    try {
      console.log('🔍 Fetching ALL assigned matches for:', guard.name)
      
      // Hämta ALLA tilldelade matcher (ingen begränsning)
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          matches(*),
          work_hours(*)
        `)
        .eq('personnel_id', guard.id)
        .eq('is_working', true)

      console.log('📋 Found assignments:', assignments?.length || 0)

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
      
      console.log('✅ Formatted assignments to send:', formattedAssignments.length)
      setAssignedMatches(formattedAssignments)

    } catch (error) {
      console.error('Error fetching assignments, trying fallback:', error)
      
      // Fallback: Hämta ALLA arbetstider (ingen begränsning)
      try {
        const { data: workHours, error: whError } = await supabase
          .from('work_hours')
          .select(`
            *,
            matches(*)
          `)
          .eq('personnel_id', guard.id)
          .order('work_date', { ascending: false })
          // BORTTAGET: .limit(5) - Nu hämtas ALLA arbetstider

        if (whError) throw whError

        console.log('📄 Fallback found work hours:', workHours?.length || 0)

        const fallbackAssignments = (workHours || []).map(wh => ({
          id: wh.id,
          match: wh.matches,
          workHours: wh,
          hasWorkHours: true
        }))

        console.log('✅ Fallback assignments to send:', fallbackAssignments.length)
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
        fontSize: '18px',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '30px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          Laddar dashboard...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      padding: window.innerWidth <= 768 ? '12px' : '24px'  // Mindre padding på mobil
    }}>
      {/* Header - MOBILANPASSAD */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 480 ? 'column' : 'row', // Stack på små skärmar
        justifyContent: 'space-between',
        alignItems: window.innerWidth <= 480 ? 'stretch' : 'center',
        gap: window.innerWidth <= 480 ? '12px' : '0',
        maxWidth: '900px',  // Bredare för desktop
        margin: '0 auto',
        marginBottom: window.innerWidth <= 768 ? '16px' : '24px',
        padding: window.innerWidth <= 768 ? '16px' : '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: window.innerWidth <= 480 ? '18px' : '20px',
          fontWeight: '700',
          color: '#ef4444',
          textAlign: window.innerWidth <= 480 ? 'center' : 'left'
        }}>
          Välkommen {guard.name}
        </h1>
        <button 
          onClick={onLogout}
          style={{
            padding: window.innerWidth <= 480 ? '12px 20px' : '10px 18px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 480 ? '16px' : '14px',
            fontWeight: '600',
            minHeight: '44px', // Touch-friendly
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f3f4f6'
          }}
        >
          Logga ut
        </button>
      </div>

      {/* Main content - MOBILANPASSAD */}
      <div style={{
        maxWidth: '900px',  // Bredare för desktop
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: window.innerWidth <= 768 ? '16px' : '24px'
      }}>
        {/* NextMatch komponent */}
        <NextMatch guard={guard} />
        
        {/* AssignedMatches komponent - får ALLA matcher */}
        <AssignedMatches 
          assignments={assignedMatches}
          onEditTimes={handleEditTimes}
        />

        {/* MyHours komponent */}
        <MyHours guard={guard} />
      </div>

      {/* TimeEditor Modal - MOBILANPASSAD */}
      {showTimeEditor && selectedAssignment && (
        <TimeEditor
          assignment={selectedAssignment}
          guard={guard}
          onSave={handleTimesSaved}
          onClose={handleCloseTimeEditor}
        />
      )}

      {/* Spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Mobilanpassad scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          
          /* Touch-friendly focus states */
          @media (max-width: 768px) {
            button:active {
              transform: scale(0.98);
            }
            
            /* Förhindra zoom på iOS */
            input, select, textarea {
              font-size: 16px !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default Dashboard