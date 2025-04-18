'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type FormData = {
  fullName: string
  email: string
  password: string
  companyName: string
  website: string
  goals: string[]
}

export default function SignUp() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const { register, handleSubmit } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    router.push('/dashboard')
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
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('fullName')}
                      type="text"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('email')}
                      type="email"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('password')}
                      type="password"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('companyName')}
                      type="text"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('website')}
                      type="url"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    LinkedIn Goals
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'networking', label: 'Professional Networking' },
                      { value: 'leads', label: 'Lead Generation' },
                      { value: 'branding', label: 'Personal Branding' },
                      { value: 'content', label: 'Content Marketing' }
                    ].map((goal) => (
                      <div key={goal.value} className="flex items-center">
                        <input
                          {...register('goals')}
                          type="checkbox"
                          value={goal.value}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          {goal.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                >
                  Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Complete Signup
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
