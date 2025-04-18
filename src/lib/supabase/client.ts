import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xyzcompany.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXZ3a3B0d2t0YXBicWJwbXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg4NTExODgsImV4cCI6MTk5NDQyNzE4OH0.h4RrGDH_N5wRBFHnvvFCQRVHh5lfaO-X4eqmjBGW-GY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable persistent sessions
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})
