'use client'

import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { type User, type Session } from '@supabase/supabase-js'
import { Toaster } from 'react-hot-toast'

// Define the shape of the context
type SupabaseContextType = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

// Create context with a placeholder/null default for the client initially
// The actual client will be provided by the provider component
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Hook to use the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Create the client instance only once using useMemo
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to sign out
  const signOut = async () => {
    // Clear any pending redirect flags
    localStorage.removeItem('pendingRedirect')
    
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    // No need to push here, onAuthStateChange handles SIGNED_OUT
    // router.push('/login') 
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
           console.error('[SupabaseProvider] Error getting initial session:', error.message)
        }
        
        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        }
      } catch (error) {
        // Catch any unexpected errors during async operation
        console.error('[SupabaseProvider] Unexpected error getting initial session:', error)
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
          // Add a small delay to ensure cookies are set?
          // await new Promise(resolve => setTimeout(resolve, 100)) 
          // Refresh might not be needed if redirection happens correctly
          // router.refresh()
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('[SupabaseProvider] User signed out')
          // Clear any pending redirect flags
          localStorage.removeItem('pendingRedirect')
          router.push('/login') // Redirect on sign out
          router.refresh() // Refresh after redirect
        }
        
        // Only set loading to false after initial check?
        // setIsLoading(false) 
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  // router dependency might cause excessive reruns, supabase is stable
  }, [supabase, router]) 

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    supabase, // Include the client instance
    user, 
    session, 
    isLoading, 
    signOut
  }), [supabase, user, session, isLoading, signOut])

  return (
    <SupabaseContext.Provider value={value}>
      {children}
      <Toaster position="top-center" />
    </SupabaseContext.Provider>
  )
}
