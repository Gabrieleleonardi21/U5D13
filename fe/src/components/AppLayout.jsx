import { Suspense, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { LibraryBig, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Paper } from '@/components/backgrounds/Paper'
import { CursorGlow } from '@/components/CursorGlow'
import { useAuth } from '@/lib/auth-context'
import { getRequests } from '@/lib/endpoints'
import { useLista } from '@/lib/lista-context'
import { cn } from '@/lib/utils'

// Voci di menu con il livello minimo richiesto per vederle
const VOCI = [
  { to: '/', label: 'Catalogo', end: true },
  { to: '/lista', label: 'La mia lista', richiede: 'user', contatore: 'lista' },
  { to: '/prestiti', label: 'I miei prestiti', richiede: 'user' },
  { to: '/admin/richieste', label: 'Richieste', richiede: 'admin', contatore: 'richieste' },
  { to: '/admin/libri', label: 'Libri', richiede: 'admin' },
  { to: '/admin/prestiti', label: 'Prestiti', richiede: 'admin' },
  { to: '/admin/costanti', label: 'Costanti', richiede: 'admin' },
  { to: '/admin/utenti', label: 'Utenti', richiede: 'superuser' },
]

function voceVisibile(voce, auth) {
  if (voce.richiede === 'user') return Boolean(auth.user)
  if (voce.richiede === 'admin') return auth.isAdmin
  if (voce.richiede === 'superuser') return auth.isSuperUser
  return true
}

function classeLink({ isActive }) {
  return cn(
    'rounded-sm px-2 py-1 text-sm underline-offset-[6px] transition-colors hover:text-primary',
    isActive && 'text-primary underline decoration-2',
  )
}

/** Numeretto accanto alla voce di menu (nascosto se zero); il testo sr-only lo rende leggibile. */
function Contatore({ valore, descrizione }) {
  if (!valore) return null
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold text-primary-foreground tabular-nums">
      {valore}
      <span className="sr-only"> {descrizione}</span>
    </span>
  )
}

export function AppLayout() {
  const auth = useAuth()
  const lista = useLista()
  // Richieste in attesa per il menu admin: basta totalElements, quindi size=1.
  // Chiave sotto 'requests': si aggiorna da sola quando l'admin approva o rifiuta.
  const inAttesa = useQuery({
    queryKey: ['requests', 'contatore'],
    queryFn: ({ signal }) => getRequests({ stato: 'IN_ATTESA', size: 1 }, { signal }),
    enabled: auth.isAdmin,
    refetchInterval: 60_000,
  })
  const contatori = {
    lista: { valore: lista.voci.length, descrizione: 'libri' },
    richieste: { valore: inAttesa.data?.totalElements, descrizione: 'in attesa' },
  }
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const primoRender = useRef(true)

  // Al cambio pagina il focus va al contenuto, così lo screen reader non riparte dal menu
  useEffect(() => {
    if (primoRender.current) {
      primoRender.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  const esci = async () => {
    await auth.logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Paper />
      <CursorGlow />
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Vai al contenuto
      </a>

      <header className="border-b-4 border-double border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
          <NavLink to="/" className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
            <LibraryBig aria-hidden="true" className="size-6 text-primary" />
            Biblioteca
          </NavLink>

          <nav aria-label="Principale" className="flex flex-wrap items-center gap-1">
            {VOCI.filter((v) => voceVisibile(v, auth)).map((v) => (
              <NavLink key={v.to} to={v.to} end={v.end} className={classeLink}>
                {v.label}
                {v.contatore && <Contatore {...contatori[v.contatore]} />}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {auth.user && (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">{auth.user.email}</span>
                <Button variant="ghost" size="sm" onClick={esci}>
                  <LogOut aria-hidden="true" />
                  Esci
                </Button>
              </>
            )}
            {/* Durante il caricamento della sessione non si mostra "Accedi": eviterebbe un lampo a chi è loggato */}
            {!auth.user && !auth.isLoading && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <NavLink to="/accedi">Accedi</NavLink>
                </Button>
                <Button size="sm" asChild>
                  <NavLink to="/registrati">Registrati</NavLink>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="contenuto" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {/* Le pagine admin sono caricate on demand (React.lazy) */}
        <Suspense fallback={<Skeleton className="mx-auto mt-10 h-64 max-w-6xl" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Biblioteca · catalogo e prestiti
      </footer>
      <Toaster position="top-center" />
    </div>
  )
}
