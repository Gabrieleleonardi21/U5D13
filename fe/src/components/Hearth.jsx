import { Fireplace } from '@/components/backgrounds/Fireplace'
import { cn } from '@/lib/utils'

/**
 * Fascia scura con il camino acceso sullo sfondo. Dentro valgono i token del tema .hearth.
 * @param {{ className?: string, children: import('react').ReactNode }} props
 */
export function Hearth({ className, children }) {
  return (
    <section className={cn('hearth relative isolate overflow-hidden', className)}>
      <Fireplace className="-z-10 opacity-80" />
      {/* Velo in alto: il testo resta leggibile sopra le fiamme */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-background via-background/70 to-transparent" />
      {children}
    </section>
  )
}
