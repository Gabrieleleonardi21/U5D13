import { useSyncExternalStore } from 'react'
import GlowCursor from '@/components/GlowCursor'

// Colori della scia presi dalla palette del progetto (lo shader vuole esadecimali, non variabili CSS):
// testa color brace (≈ --primary di .hearth) che sfuma nel rosso cuoio (≈ --primary del tema carta)
const COLORE_BRACE = '#e9a23b'
const COLORE_CUOIO = '#8b3a2b'

// Solo con mouse/trackpad e se l'utente non ha chiesto di ridurre le animazioni
const QUERY = '(pointer: fine) and (prefers-reduced-motion: no-preference)'

function iscriviti(callback) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

const attivo = () => window.matchMedia(QUERY).matches

/**
 * Scia luminosa che segue il cursore su tutto il sito.
 * Overlay fisso sopra la pagina, trasparente ai click e agli screen reader.
 */
export function CursorGlow() {
  const abilitato = useSyncExternalStore(iscriviti, attivo, () => false)
  if (!abilitato) return null

  return (
    <GlowCursor
      followWindow
      aria-hidden="true"
      className="pointer-events-none fixed! inset-0 z-50"
      color={COLORE_BRACE}
      secondaryColor={COLORE_CUOIO}
      trailLength={32}
      trailWidth={6}
      trailTaper={0.8}
      followSpeed={0.18}
      glowIntensity={1.4}
      glowSpread={1}
      hotspot={0.35}
      brightness={1.1}
      opacity={0.75}
      pulseSpeed={1.1}
      noiseStrength={0.035}
      idleFade
      idleTimeout={700}
      fadeDuration={900}
      // "normal": su carta chiara "plus-lighter" diventerebbe quasi bianco e invisibile
      blendMode="normal"
      maxDevicePixelRatio={1}
    />
  )
}
