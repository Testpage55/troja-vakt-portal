// 📁 FILNAMN: src/components/Dashboard.js
// 🎨 ÅTGÄRD: ERSÄTT din befintliga Dashboard.js med denna FÖRBÄTTRADE version

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
        fontSize: '24px',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '40px',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Laddar dashboard...
          </div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>
            Hämtar dina uppdrag
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      padding: window.innerWidth <= 768 ? '16px' : '24px'
    }}>
      {/* Header - FÖRBÄTTRAD med Troja-logo, större text och centrerat */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: window.innerWidth <= 768 ? '20px' : '24px',
        maxWidth: '1000px',
        margin: '0 auto',
        marginBottom: window.innerWidth <= 768 ? '24px' : '32px',
        padding: window.innerWidth <= 768 ? '24px' : '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Logo + Välkomsttext - KOMBINERAD sektion */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: window.innerWidth <= 768 ? '16px' : '24px',
          textAlign: window.innerWidth <= 768 ? 'center' : 'left',
          flex: '1',
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
        }}>
          {/* Troja Logo */}
          <img 
            src="/troja-logo.png" 
            alt="Troja Ljungby" 
            style={{
              maxWidth: window.innerWidth <= 768 ? '60px' : '80px',
              height: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))',
              transition: 'all 0.3s ease'
            }}
            onError={(e) => {
              // Fallback till emoji om bilden inte hittas
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'inline-block'
            }}
          />
          <div style={{
            display: 'none',
            fontSize: window.innerWidth <= 768 ? '40px' : '60px',
            filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))'
          }}>
            🏒
          </div>

          {/* Välkomsttext */}
          <div>
            <h1 style={{
              margin: 0,
              fontSize: window.innerWidth <= 768 ? '24px' : '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              Välkommen {guard.name} 
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: window.innerWidth <= 768 ? '14px' : '16px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Översikt för kommande uppdrag
            </p>
          </div>
        </div>

        {/* Logga ut-knapp - FÖRBÄTTRAD design */}
        <button 
          onClick={onLogout}
          style={{
            padding: window.innerWidth <= 768 ? '16px 24px' : '18px 32px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            color: '#374151',
            border: '2px solid #d1d5db',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 768 ? '16px' : '18px',
            fontWeight: '700',
            minHeight: '56px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          Logga ut
        </button>
      </div>

      {/* Main content - CENTRERAT och förbättrat spacing */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: window.innerWidth <= 768 ? '20px' : '32px'
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

      {/* TimeEditor Modal */}
      {showTimeEditor && selectedAssignment && (
        <TimeEditor
          assignment={selectedAssignment}
          guard={guard}
          onSave={handleTimesSaved}
          onClose={handleCloseTimeEditor}
        />
      )}

      {/* Global styles */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Mobilanpassad scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          /* Touch-friendly focus states */
          @media (max-width: 768px) {
            button:active {
              transform: scale(0.98) !important;
            }
            
            /* Förhindra zoom på iOS */
            input, select, textarea {
              font-size: 16px !important;
            }
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
          
          /* Better text rendering */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}
      </style>
    </div>
  )
}

export default Dashboard