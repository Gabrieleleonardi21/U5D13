/**
 * Intestazione delle pagine di gestione: titolo editoriale e pulsanti a destra.
 * @param {{ titolo: string, descrizione: string, children?: import('react').ReactNode }} props
 */
export function AdminHeader({ titolo, descrizione, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Banco del bibliotecario</p>
        <h1 className="mt-2 text-4xl font-semibold">{titolo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{descrizione}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}
