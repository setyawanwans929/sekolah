import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ParentChildContext = createContext(null)

export function ParentChildProvider({ children }) {
  const { profile } = useAuth()
  const [kids, setKids] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!profile?.parent_id) { setLoading(false); return }
      const { data } = await supabase.from('students').select('id, full_name, nis').eq('parent_id', profile.parent_id)
      setKids(data || [])
      setSelected(data?.[0]?.id || null)
      setLoading(false)
    })()
  }, [profile])

  return (
    <ParentChildContext.Provider value={{ kids, selected, setSelected, loading }}>
      {children}
    </ParentChildContext.Provider>
  )
}

export function useParentChild() {
  const ctx = useContext(ParentChildContext)
  if (!ctx) throw new Error('useParentChild harus dipakai di dalam ParentChildProvider')
  return ctx
}
