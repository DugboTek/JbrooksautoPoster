'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import Link from 'next/link'
import { useForm, SubmitHandler } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

type LoginFormData = {
  email: string
  password: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  // Effect to handle auth state changes
  useEffect(() => {
    if (!supabase) return;

    console.log('[Login] Setting up onAuthStateChange listener.');
    
    // Remove any stale redirect flags on component mount
    localStorage.removeItem('pendingRedirect');
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Login] onAuthStateChange event: ${event}`);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[Login] SIGNED_IN event detected with valid session');
        
        // Check if we have a pending redirect flag
        if (localStorage.getItem('pendingRedirect') === 'true') {
          console.log('[Login] Performing redirect to dashboard');
          localStorage.removeItem('pendingRedirect'); // Clear the flag
          
          // Safer navigation approach that works with relative paths
          try {
            // Try Next.js router first (for client-side navigation to home page)
            router.push('/home');
          } catch (error) {
            console.error('[Login] Router push error:', error);
            // Fallback to direct navigation
            window.location.href = '/home';
          }
        }
      }
    });

    // Cleanup listener on component unmount
    return () => {
      console.log('[Login] Cleaning up onAuthStateChange listener.');
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogin: SubmitHandler<LoginFormData> = async (data) => {
    if (!supabase) {
      console.error('[Login] Supabase client not available from provider.');
      toast.error('Authentication service not ready. Please try again.');
      return;
    }

    setLoading(true)
    console.log('[Login] Form submitted. Data:', data);

    try {
      console.log('[Login] Attempting supabase.auth.signInWithPassword...');
      
      // Set the redirect flag right before login attempt
      localStorage.setItem('pendingRedirect', 'true');
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      
      if (error) {
        console.error('[Login] supabase.auth.signInWithPassword error:', error);
        // Clear the flag on error
        localStorage.removeItem('pendingRedirect');
        throw error
      }
      
      // Login successful, just show toast. Redirection handled by onAuthStateChange.
      console.log('[Login] Login API call successful.');
      toast.success('Logged in successfully!')
      
    } catch (error: any) {
      console.error('[Login] Overall error during login process:', error)
      toast.error(error.message || 'Invalid email or password')
      // Clear the redirect flag if login fails
      localStorage.removeItem('pendingRedirect');
    } finally {
      console.log('[Login] Setting loading to false.');
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!supabase) {
      console.error('[Login] Supabase client not available from provider for password reset.');
      toast.error('Authentication service not ready. Please try again.');
      return;
    }

    const email = prompt('Please enter your email address:')
    
    if (!email) return
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      toast.success('Password reset email sent. Please check your inbox.')
    } catch (error: any) {
      console.error('Error sending reset email:', error)
      toast.error(error.message || 'Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link 
              href="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleLogin)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={handleResetPassword}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
