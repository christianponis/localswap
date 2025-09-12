import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function FirebaseLoginPage() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <LoginClient />
    </Suspense>
  )
}