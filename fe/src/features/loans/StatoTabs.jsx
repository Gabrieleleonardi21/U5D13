import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STATI_PRESTITO } from '@/lib/format'

const TUTTI = 'TUTTI'

/**
 * Filtro per stato del prestito. value vuoto = tutti.
 * @param {{ value: string, onChange: (stato: string) => void }} props
 */
export function StatoTabs({ value, onChange }) {
  const cambia = (v) => {
    if (v === TUTTI) onChange('')
    else onChange(v)
  }
  return (
    <Tabs value={value || TUTTI} onValueChange={cambia}>
      <TabsList aria-label="Filtra per stato">
        <TabsTrigger value={TUTTI}>Tutti</TabsTrigger>
        {Object.entries(STATI_PRESTITO).map(([chiave, s]) => (
          <TabsTrigger key={chiave} value={chiave}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
