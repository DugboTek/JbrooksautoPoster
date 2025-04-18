'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

type FormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  website: string
  goals: string[]
  industry: string
}

// Available goals for the user to select
const AVAILABLE_GOALS = [
  'Generate more leads',
  'Increase brand awareness',
  'Grow LinkedIn following',
  'Position as thought leader',
  'Drive website traffic',
  'Recruit talent',
  'Network with industry peers'
]

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, getValues, formState: { errors }, watch } = useForm<FormData>()
  const password = watch('password')
  
  // State for selected goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  const nextStep = () => {
    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true)
    console.log('[Signup] Form submitted. Data:', data);
    console.log('[Signup] Selected Goals:', selectedGoals);
    
    try {
      console.log('[Signup] Attempting supabase.auth.signUp...');
      // Create the user in Supabase Auth & pass profile data for trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            // Pass data for the trigger function
            // Ensure keys match what the trigger expects
            full_name: data.fullName,
            company_name: data.companyName,
            website: data.website,
            goals: selectedGoals, // Pass the state variable with selected goals
            industry: data.industry
          }
        }
      })
      
      if (authError) {
        console.error('[Signup] supabase.auth.signUp error:', authError);
        throw authError;
      }

      console.log('[Signup] supabase.auth.signUp successful. Auth Data:', authData);
      
      // Check if user creation was successful (authData.user is not null)
      if (authData.user) {
        console.log(`[Signup] User ${authData.user.id} created. Attempting client-side profile insert...`);
        
        // Re-add client-side insert into user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles') 
          .insert({
            id: authData.user.id, 
            full_name: data.fullName,
            company_name: data.companyName,
            website: data.website,
            goals: selectedGoals, 
            industry: data.industry
          });

        if (profileError) {
           console.error('[Signup] Error inserting profile data:', profileError);
           // Optional: Attempt to delete the auth user if profile insert fails?
           // Consider the user experience implications here.
           toast.error(`Account created, but failed to save profile: ${profileError.message}`);
           // Don't necessarily throw, maybe let them log in and fix profile later?
           // throw profileError; 
        } else {
           console.log('[Signup] Profile data inserted successfully.');
           toast.success('Account created successfully! Please check your email to confirm your account.');
        }
        
        console.log('[Signup] Navigating to /login');
        router.push('/login')
      } else {
         // Handle case where signup might succeed but user data is missing (should be rare)
         console.error('[Signup] Error: Signup succeeded but no user data returned.', authData);
         throw new Error("User registration succeeded but no user data was returned.")
      }
    } catch (error: any) {
      console.error('[Signup] Overall error during sign up process:', error);
      // More specific error handling could be added here
      toast.error(error.message || 'An error occurred during sign up')
    } finally {
      console.log('[Signup] Setting loading to false.');
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                key="fullName"
                type="text"
                autoComplete="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                key="email"
                type="email"
                autoComplete="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                key="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
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
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                key="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  const { fullName, email, password, confirmPassword } = getValues();
                  if (fullName && email && password && confirmPassword && password === confirmPassword) {
                    nextStep();
                  } else {
                    // Trigger validation
                    handleSubmit(() => {})();
                  }
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                id="companyName"
                key="companyName"
                type="text"
                autoComplete="organization"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('companyName', { required: 'Company name is required' })}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Company Website
              </label>
              <input
                id="website"
                key="website"
                type="url"
                autoComplete="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('website', { 
                  required: 'Website is required',
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]+(\.[a-zA-Z]{2,})+(\.[a-zA-Z]{2,})?$/,
                    message: 'Invalid website URL'
                  }
                })}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <input
                id="industry"
                key="industry"
                type="text"
                autoComplete="organization-title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('industry', { required: 'Industry is required' })}
              />
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>

            <div className="flex justify-between space-x-4 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const { companyName, website, industry } = getValues();
                  if (companyName && website && industry) {
                    nextStep();
                  } else {
                    // Trigger validation
                    handleSubmit(() => {})();
                  }
                }}
                className="w-1/2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your goals? (Select all that apply)
              </label>
              <div className="space-y-2">
                {AVAILABLE_GOALS.map((goal) => (
                  <div key={goal} className="flex items-center">
                    <input
                      id={goal}
                      key={goal}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedGoals.includes(goal)}
                      onChange={() => handleGoalToggle(goal)}
                    />
                    <label htmlFor={goal} className="ml-2 block text-sm text-gray-700">
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
              {selectedGoals.length === 0 && (
                <p className="mt-1 text-sm text-red-600">Please select at least one goal</p>
              )}
            </div>

            <div className="flex justify-between space-x-4 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || selectedGoals.length === 0}
                className="w-1/2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <div className="flex justify-between">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Account</span>
              <span>Company</span>
              <span>Goals</span>
            </div>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
