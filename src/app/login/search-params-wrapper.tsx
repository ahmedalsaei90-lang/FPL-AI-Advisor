'use client'

import { Suspense } from 'react'
import LoginPage from './login-content'

export default function SearchParamsWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}