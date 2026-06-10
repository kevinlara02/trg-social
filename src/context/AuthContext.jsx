import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEMO, demoProfile } from '../lib/demo'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!DEMO) // demo: nothing to load

  // Load the signed-in user's profile (role + assigned restaurant)
  async function fetchProfile(userId) {
    if (!userId) return null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, location_id, active')
        .eq('id', userId)
        .single()
      return data || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (DEMO) return // demo mode: sign-in is handled locally, no Supabase session
    let active = true

    // 1. Restore any existing session on first load
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!active) return
        const s = data?.session ?? null
        setSession(s)
        setProfile(await fetchProfile(s?.user?.id))
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })

    // 2. React to sign in / sign out / token refresh.
    //    Do not `await` inside this callback (Supabase holds a lock);
    //    update session synchronously and resolve the profile separately.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return
      setSession(s)
      fetchProfile(s?.user?.id).then((p) => { if (active) setProfile(p) })
    })

    return () => { active = false; subscription?.unsubscribe() }
  }, [])

  async function signIn(email, password) {
    if (DEMO) {
      // Any credentials sign you in as the demo administrator.
      setSession({ user: { id: demoProfile.id } })
      setProfile(demoProfile)
      return null
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  async function signOut() {
    if (DEMO) { setSession(null); setProfile(null); return }
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const role = profile?.role || null
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  // Only admins see all restaurants. Managers and staff are scoped to their own.
  const scopedLocationId = isAdmin ? null : (profile?.location_id ?? null)

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      role,
      isAdmin,
      isManager,
      scopedLocationId,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
