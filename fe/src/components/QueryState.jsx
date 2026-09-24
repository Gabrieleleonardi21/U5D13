import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { messaggioErrore } from '@/lib/errors'

/**
 * Gestisce i tre stati di una query TanStack prima di mostrare i dati:
 * caricamento (skeleton), errore (con "Riprova") e lista vuota.
 * @param {{ query: import('@tanstack/react-query').UseQueryResult, isEmpty?: (data: any) => boolean,
 *           empty?: import('react').ReactNode, skeleton?: import('react').ReactNode,
 *           children: (data: any) => import('react').ReactNode }} props
 */
export function QueryState({ query, isEmpty, empty, skeleton, children }) {
  if (query.isPending) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Caricamento…</span>
        {skeleton ?? <Skeleton className="h-40 w-full" />}
      </div>
    )
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle aria-hidden="true" className="size-4" />
          {messaggioErrore(query.error)}
        </p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Riprova
        </Button>
      </div>
    )
  }
  if (isEmpty?.(query.data)) {
    return <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{empty}</div>
  }
  return children(query.data)
}
