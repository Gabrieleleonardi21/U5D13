import { lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './App.css'
import { AppLayout } from '@/components/AppLayout'
import { AuthProvider } from '@/components/AuthProvider'
import { ErrorPage, NotFoundPage } from '@/components/ErrorPage'
import { ListaProvider } from '@/components/ListaProvider'
import { RequireAuth } from '@/components/RequireAuth'
import { ApiError } from '@/lib/api'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { ListaPage } from '@/features/lista/ListaPage'
import { MyLoansPage } from '@/features/loans/MyLoansPage'

// Pagine di gestione caricate solo da chi ci entra: il bundle iniziale resta leggero per i lettori
const BooksAdminPage = lazy(() => import('@/features/admin/books/BooksAdminPage'))
const LoansAdminPage = lazy(() => import('@/features/admin/loans/LoansAdminPage'))
const ConstantsPage = lazy(() => import('@/features/admin/constants/ConstantsPage'))
const UsersPage = lazy(() => import('@/features/admin/users/UsersPage'))
const RequestsPage = lazy(() => import('@/features/admin/requests/RequestsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Si riprova solo per errori di rete o 5xx; un 4xx non cambia riprovando.
      // Eccezione: 401 una volta, perché il BE ha appena cancellato il cookie scaduto/revocato
      // e al secondo tentativo gli endpoint pubblici (catalogo) rispondono da anonimi.
      retry: (tentativi, err) => {
        if (!(err instanceof ApiError)) return tentativi < 2
        if (err.status === 401) return tentativi < 1
        return err.status >= 500 && tentativi < 2
      },
    },
  },
})

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'accedi', element: <LoginPage /> },
      { path: 'registrati', element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'prestiti', element: <MyLoansPage /> },
          { path: 'lista', element: <ListaPage /> },
        ],
      },
      {
        path: 'admin',
        element: <RequireAuth ruolo="admin" />,
        children: [
          { path: 'richieste', element: <RequestsPage /> },
          { path: 'libri', element: <BooksAdminPage /> },
          { path: 'prestiti', element: <LoansAdminPage /> },
          { path: 'costanti', element: <ConstantsPage /> },
        ],
      },
      {
        path: 'admin',
        element: <RequireAuth ruolo="superuser" />,
        children: [{ path: 'utenti', element: <UsersPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* La lista dei libri scelti dipende dall'utente: dentro AuthProvider */}
        <ListaProvider>
          <RouterProvider router={router} />
        </ListaProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
