import { Navigate, Outlet, useLocation } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'

/**
 * Protegge un gruppo di rotte. È solo UX: i permessi veri li impone il backend con @PreAuthorize.
 * @param {{ ruolo?: 'admin' | 'superuser' }} props senza ruolo basta essere autenticati
 */
export function RequireAuth({ ruolo }) {
  const { user, isLoading, isAdmin, isSuperUser } = useAuth()
  const location = useLocation()

  // Finché /api/user/me non ha risposto non si sa se c'è una sessione: niente redirect prematuri
  if (isLoading) return <Skeleton className="mx-auto mt-10 h-64 max-w-6xl" />

  // Dopo il login si torna alla pagina richiesta
  if (!user) return <Navigate to="/accedi" replace state={{ da: location.pathname }} />
  if (ruolo === 'admin' && !isAdmin) return <Navigate to="/" replace />
  if (ruolo === 'superuser' && !isSuperUser) return <Navigate to="/" replace />
  return <Outlet />
}
