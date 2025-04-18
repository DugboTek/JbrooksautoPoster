'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { Toaster } from 'react-hot-toast'

// Define the shape of the context
type SupabaseContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

// Create context with default values
const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {}
})

// Hook to use the Supabase context
export const useSupabase = () => useContext(SupabaseContext)

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to sign out
  const signOut = async () => {
    // Clear any pending redirect flags
    localStorage.removeItem('pendingRedirect');
    
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    router.push('/login')
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`[SupabaseProvider] Auth state change: ${event}`)
        
        // Update session and user on all auth events
        setSession(newSession)
        setUser(newSession?.user || null)
        
        if (event === 'SIGNED_IN') {
          console.log('[SupabaseProvider] User signed in')
          // Add a small delay to ensure cookies are set
          await new Promise(resolve => setTimeout(resolve, 100))
          router.refresh()
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('[SupabaseProvider] User signed out')
          router.refresh()
          // Clear any pending redirect flags
          localStorage.removeItem('pendingRedirect')
          router.push('/login')
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <SupabaseContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
      <Toaster position="top-center" />
    </SupabaseContext.Provider>
  )
}
