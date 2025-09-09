// 📋 FILNAMN: src/components/NextMatch.js
// 🔄 ÅTGÄRD: ERSÄTT din befintliga NextMatch.js med denna FÖRBÄTTRADE version

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function NextMatch({ guard }) {
  const [nextWorkShift, setNextWorkShift] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNextWorkShift()
  }, [guard.id])

  useEffect(() => {
    let interval = null
    
    if (nextWorkShift) {
      interval = setInterval(() => {
        updateCountdown()
      }, 1000)
      updateCountdown()
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [nextWorkShift])

  const fetchNextWorkShift = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('🔍 Fetching work shifts for:', guard.name, 'ID:', guard.id)
      console.log('📅 Today:', today)
      
      // Strategi 1: Hämta arbetstider först, sedan matcher
      const { data: workHours, error: workHoursError } = await supabase
        .from('work_hours')
        .select('*')
        .eq('personnel_id', guard.id)
        .gte('work_date', today)
        .order('work_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
      
      console.log('⏰ Work hours found:', workHours)
      console.log('❌ Work hours error:', workHoursError)
      
      if (workHours && workHours.length > 0) {
        const workHour = workHours[0]
        
        // Hämta matchinfo för denna arbetstid
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', workHour.match_id)
          .single()
        
        console.log('⚽ Match for work hour:', match)
        
        if (match) {
          console.log('✅ Found next work shift via work_hours')
          setNextWorkShift({
            match: match,
            workHours: workHour,
            hasWorkHours: true
          })
          return
        }
      }
      
      // Strategi 2: Hämta assignments separat
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('personnel_id', guard.id)
      
      console.log('📋 Assignments found:', assignments)
      
      if (assignments && assignments.length > 0) {
        // För varje assignment, hämta matchinfo
        const matchPromises = assignments.map(async (assignment) => {
          const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', assignment.match_id)
            .gte('date', today)
            .single()
          
          return match ? { assignment, match } : null
        })
        
        const matchResults = await Promise.all(matchPromises)
        const validMatches = matchResults.filter(result => result !== null)
        
        console.log('🎯 Valid upcoming matches:', validMatches)
        
        if (validMatches.length > 0) {
          // Sortera på datum
          validMatches.sort((a, b) => new Date(a.match.date) - new Date(b.match.date))
          
          const nextMatch = validMatches[0]
          console.log('✅ Found next match via assignments')
          setNextWorkShift({
            match: nextMatch.match,
            workHours: null,
            hasWorkHours: false
          })
          return
        }
      }
      
      // Strategi 3: Visa allmänna kommande matcher
      const { data: allMatches, error: allMatchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
      
      console.log('🌍 All upcoming matches:', allMatches)
      
      if (allMatches && allMatches.length > 0) {
        console.log('✅ Showing general upcoming match')
        setNextWorkShift({
          match: allMatches[0],
          workHours: null,
          hasWorkHours: false
        })
      } else {
        console.log('❌ No matches found at all')
        setNextWorkShift(null)
      }
      
    } catch (error) {
      console.error('💥 Error fetching next work shift:', error)
      setNextWorkShift(null)
    } finally {
      setLoading(false)
    }
  }

  const updateCountdown = () => {
    if (!nextWorkShift) return
    
    const now = new Date()
    // Använd arbetstid om den finns, annars matchtid
    const workTime = nextWorkShift.workHours?.start_time || nextWorkShift.match.time || '19:00'
    
    // Skapa korrekt datum-tid string
    let dateTimeString = `${nextWorkShift.match.date}T${workTime}`
    if (!workTime.includes(':')) {
      dateTimeString += ':00'
    } else if (workTime.split(':').length === 2) {
      dateTimeString += ':00'
    }
    
    const shiftDateTime = new Date(dateTimeString)
    const timeDiff = shiftDateTime - now
    
    console.log('⏰ Countdown calculation:', {
      now: now.toISOString(),
      shiftDateTime: shiftDateTime.toISOString(), 
      timeDiff: timeDiff,
      workTime: workTime
    })
    
    if (timeDiff <= 0) {
      setCountdown('Pågår nu!')
      return
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
    
    if (days > 0) {
      setCountdown(`${days}d ${hours}h ${minutes}m`)
    } else if (hours > 0) {
      setCountdown(`${hours}h ${minutes}m ${seconds}s`)
    } else if (minutes > 0) {
      setCountdown(`${minutes}m ${seconds}s`)
    } else {
      setCountdown(`${seconds}s`)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString.split(':').slice(0, 2).join(':')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Idag'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Imorgon'
    }
    
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'short' 
    })
  }

  if (loading) {
    return (
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        Laddar kommande arbetspass...
      </div>
    )
  }

  if (!nextWorkShift) {
    return (
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1f2937' }}>
          Ditt kommande arbetspass
        </h2>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Inga kommande arbetspass schemalagda
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      marginBottom: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937'
      }}>
        Ditt kommande arbetspass
      </h2>

      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '12px'
        }}>
          IF Troja-Ljungby - {nextWorkShift.match.opponent}
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'monospace',
            marginBottom: '4px'
          }}>
            {countdown}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            kvar till {nextWorkShift.hasWorkHours ? 'arbetsstart' : 'matchstart'}
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: nextWorkShift.hasWorkHours ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr',
          gap: '8px',
          fontSize: '14px',
          opacity: 0.9,
          marginBottom: '12px'
        }}>
          <div>{formatDate(nextWorkShift.match.date)}</div>
          {nextWorkShift.hasWorkHours && (
            <div>Arbetsstart: {formatTime(nextWorkShift.workHours.start_time)}</div>
          )}
          <div>Matchstart: {nextWorkShift.match.time || 'TBA'}</div>
          <div>{nextWorkShift.match.match_type === 'away' ? 'Borta' : 'Hemma'}</div>
        </div>
        
        {nextWorkShift.hasWorkHours && (
          <div style={{
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '12px'
          }}>
            Arbetstid: {formatTime(nextWorkShift.workHours.start_time)} - {formatTime(nextWorkShift.workHours.end_time)}
          </div>
        )}
      </div>
    </div>
  )
}

export default NextMatch