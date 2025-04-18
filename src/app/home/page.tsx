'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded">
        <h1 className="text-2xl font-bold text-center">Test Home Page</h1>
        <p className="text-center">This is a test page to verify routing</p>
        <div className="mt-8 space-y-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
} 