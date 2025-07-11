
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ptglxbqaucefcjdewsrd.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z2x4YnFhdWNlZmNqZGV3c3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODk0NzgsImV4cCI6MjA2Njk2NTQ3OH0.4bZPcxklqAkXQHjfM7LQjr7mMad7nbKhPixDbtNAYWM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
