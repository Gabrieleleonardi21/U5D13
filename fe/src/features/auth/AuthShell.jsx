import { Hearth } from '@/components/Hearth'

/**
 * Impaginazione comune di login e registrazione: camino a sinistra, modulo su carta a destra.
 * @param {{ titolo: string, sottotitolo: string, children: import('react').ReactNode }} props
 */
export function AuthShell({ titolo, sottotitolo, children }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-4 py-10 lg:grid-cols-2">
      <Hearth className="hidden min-h-[520px] rounded-l-md p-10 lg:flex lg:flex-col lg:justify-start">
        <blockquote className="max-w-sm">
          <p className="font-heading text-2xl leading-snug">
            “Una stanza senza libri è come un corpo senz’anima.”
          </p>
          <footer className="mt-3 text-sm text-muted-foreground">— Cicerone</footer>
        </blockquote>
      </Hearth>
      <div className="rounded-md border border-border bg-card/80 p-8 backdrop-blur-sm sm:p-10 lg:rounded-l-none lg:border-l-0">
        <h1 className="text-3xl font-semibold">{titolo}</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">{sottotitolo}</p>
        {children}
      </div>
    </div>
  )
}
