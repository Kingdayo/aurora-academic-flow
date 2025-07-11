
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ptglxbqaucefcjdewsrd.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z2x4YnFhdWNlZmNqZGV3c3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk5MDE0ODMsImV4cCI6MjAzNTQ3NzQ4M30.kHhiYgQa_k4bqJZn1WOWIGImq5v3U8aANFgVHZVF4Ns"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
