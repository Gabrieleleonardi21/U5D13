import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, setUnauthorizedHandler } from '@/lib/api'
import { AuthContext } from '@/lib/auth-context'
import * as endpoints from '@/lib/endpoints'

// Il JWT sta in un cookie HttpOnly che JavaScript non può leggere.
// Il FE sa chi è l'utente da /api/user/me e conserva solo la scadenza (non sensibile) per il refresh.
// localStorage perché il cookie vale per tutte le schede: così anche la scadenza è condivisa.
const CHIAVE_SCADENZA = 'biblioteca.scadenza'
// Rinnovo un minuto prima della scadenza (il BE non accetta refresh di token scaduti)
const ANTICIPO_REFRESH_MS = 60_000

function leggiScadenza() {
  try {
    return Number(localStorage.getItem(CHIAVE_SCADENZA)) || 0
  } catch {
    return 0
  }
}

function salvaScadenza(expiresAt) {
  try {
    if (expiresAt) localStorage.setItem(CHIAVE_SCADENZA, String(expiresAt))
    else localStorage.removeItem(CHIAVE_SCADENZA)
  } catch {
    // storage non disponibile: al prossimo avvio si fa un refresh subito, nessun problema
  }
}

// Sessione all'avvio: 401 significa semplicemente "non autenticato"
async function caricaSessione({ signal }) {
  try {
    return await endpoints.getSessione({ signal })
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const sessione = useQuery({ queryKey: ['me'], queryFn: caricaSessione, staleTime: Infinity, retry: false })
  const me = sessione.data ?? null
  const [scadenza, setScadenza] = useState(leggiScadenza)

  const aggiornaScadenza = useCallback((expiresAt) => {
    const ms = expiresAt && new Date(expiresAt).getTime()
    salvaScadenza(ms)
    setScadenza(ms || 0)
  }, [])

  // Chiude la sessione lato UI: dati personali fuori dalla cache e utente anonimo
  const chiudiSessione = useCallback(() => {
    aggiornaScadenza(null)
    queryClient.clear()
    queryClient.setQueryData(['me'], null)
  }, [aggiornaScadenza, queryClient])

  // 401 da una chiamata autenticata: token scaduto o revocato (es. dopo grantAdmin).
  // Se in cache non c'è un utente si era già anonimi: niente da chiudere.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!queryClient.getQueryData(['me'])) return
      chiudiSessione()
      toast.info('La sessione è scaduta: accedi di nuovo.')
    })
  }, [chiudiSessione, queryClient])

  // Un'altra scheda ha fatto refresh, login o logout: ci si allinea
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== CHIAVE_SCADENZA) return
      setScadenza(Number(e.newValue) || 0)
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  // Refresh automatico prima della scadenza. Senza scadenza nota (es. storage svuotato) si rinnova subito.
  useEffect(() => {
    if (!me) return
    const attesa = Math.max(scadenza - Date.now() - ANTICIPO_REFRESH_MS, 0)
    const timer = setTimeout(async () => {
      try {
        const res = await endpoints.refresh()
        aggiornaScadenza(res.expiresAt)
      } catch {
        chiudiSessione()
      }
    }, attesa)
    return () => clearTimeout(timer)
  }, [me, scadenza, aggiornaScadenza, chiudiSessione])

  const login = useCallback(
    async (email, password) => {
      const res = await endpoints.login(email, password)
      // Via la cache dell'eventuale utente precedente, poi si carica il nuovo profilo
      queryClient.clear()
      aggiornaScadenza(res.expiresAt)
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: caricaSessione })
    },
    [aggiornaScadenza, queryClient],
  )

  const logout = useCallback(async () => {
    try {
      // Revoca il token e cancella il cookie lato server
      await endpoints.logout()
    } catch {
      // Token già scaduto: il BE ha comunque cancellato il cookie con il 401
    } finally {
      chiudiSessione()
    }
  }, [chiudiSessione])

  const value = useMemo(() => {
    const roles = me?.ruoli ?? []
    const isSuperUser = roles.includes('SuperUser')
    let user = null
    if (me) user = { id: me.id, email: me.email, roles }
    return {
      user,
      // Profilo completo di /api/user/me (nome, cognome, iscrizione...), null se anonimo
      profilo: me,
      isLoading: sessione.isPending,
      isSuperUser,
      isAdmin: isSuperUser || roles.includes('Admin'),
      login,
      logout,
    }
  }, [me, sessione.isPending, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
