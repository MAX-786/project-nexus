'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-red-50/30">
      <h2 className="text-2xl font-bold text-red-800 mb-2">Something went wrong!</h2>
      <p className="text-red-600 mb-6 max-w-lg bg-red-100 p-4 rounded-md text-sm font-mono text-left overflow-auto border border-red-200 shadow-sm">
        {error.message || "An unexpected error occurred while loading your dashboard."}
      </p>
      <div className="flex gap-4">
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </button>
      </div>
    </div>
  )
}
