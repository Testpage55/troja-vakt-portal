import { createClient } from '@supabase/supabase-js'

// Använd samma värden som i din admin-app
const supabaseUrl = 'https://wgjujusgjncxkybeoizf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnanVqdXNnam5jeGt5YmVvaXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjAyNjksImV4cCI6MjA3MjU5NjI2OX0.GR7YwhPBhPI2S94pZ5VoY78hmRUj8QRg_rgu8wZt5Qk'

export const supabase = createClient(supabaseUrl, supabaseKey)