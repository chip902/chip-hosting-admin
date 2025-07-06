'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the Payload admin dashboard
    router.push('/cms-admin')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to CMS Admin...</p>
    </div>
  )
}