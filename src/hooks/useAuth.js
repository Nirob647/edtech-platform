import { useEffect, useState } from 'react'
import { supabase } from '../services/database/supabaseClient'
import { getMyProfile } from '../modules/auth/authService'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      if (data.session) {
        const p = await getMyProfile()
        if (mounted) setProfile(p)
      }
      setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        const p = await getMyProfile()
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, profile, loading, isAdmin: profile?.role === 'admin' }
}
