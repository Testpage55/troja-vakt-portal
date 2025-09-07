import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Login({ onLogin }) {
  const [personnel, setPersonnel] = useState([])
  const [selectedGuard, setSelectedGuard] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonnel()
  }, [])

  const fetchPersonnel = async () => {
    try {
      const { data } = await supabase
        .from('personnel')
        .select('*')
        .order('name')
      
      setPersonnel(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedGuard) {
      const guard = personnel.find(p => p.id === parseInt(selectedGuard))
      onLogin(guard)
    }
  }

  if (loading) return <div>Laddar vakter...</div>

  return (
    <div className="login">
      <div className="login-card">
        <h1>Troja-Ljungby Vaktportal</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Välj ditt namn:
            <select 
              value={selectedGuard} 
              onChange={(e) => setSelectedGuard(e.target.value)}
              required
            >
              <option value="">Välj vakt...</option>
              {personnel.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={!selectedGuard}>
            Logga in
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login