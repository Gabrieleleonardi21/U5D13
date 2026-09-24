import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Fiamme di un camino con braci che salgono, ispirato a "Fireplace" di shadcn.io/background.
// Canvas 2D a particelle: si ferma fuori schermo e con prefers-reduced-motion disegna un solo fotogramma.

// Sprite sfumati disegnati una volta sola: ogni frame fa solo drawImage, molto più economico dei gradienti
function creaSprite(colore) {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, colore)
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return c
}

// Dal cuore della fiamma (giallo chiaro) alla punta (rosso scuro)
const COLORI_FIAMMA = ['rgba(255, 236, 170, 1)', 'rgba(255, 170, 60, 1)', 'rgba(230, 90, 30, 1)', 'rgba(150, 40, 20, 1)']

function spriteDellaFiamma(sprites, eta) {
  const indice = Math.min(Math.floor(eta * sprites.length), sprites.length - 1)
  return sprites[indice]
}

// Numero casuale con distribuzione a campana (media 0): le fiamme si addensano attorno ai ceppi
function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

// Posizioni dei "ceppi" lungo la larghezza (in frazione): da lì nascono le lingue di fuoco
const CEPPI = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88]

function nuovaFiamma(w, h) {
  const ceppo = CEPPI[Math.floor(Math.random() * CEPPI.length)]
  return {
    x: w * ceppo + gauss() * w * 0.06,
    y: h + 10,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(1 + Math.random() * 1.4) * (h / 320),
    r: 14 + Math.random() * 20,
    vita: 0,
    durata: 45 + Math.random() * 40,
  }
}

function nuovaBrace(w, h) {
  return {
    x: w * (0.1 + Math.random() * 0.8),
    y: h - Math.random() * h * 0.15,
    vy: -(0.4 + Math.random() * 0.9) * (h / 320),
    fase: Math.random() * Math.PI * 2,
    size: 1 + Math.random() * 1.8,
    vita: 0,
    durata: 120 + Math.random() * 160,
  }
}

/**
 * Fiamme animate che riempiono il contenitore padre (che deve essere position: relative).
 * @param {{ className?: string, intensita?: number }} props intensita: moltiplicatore del numero di particelle
 */
export function Fireplace({ className, intensita = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const sprites = COLORI_FIAMMA.map(creaSprite)
    const riduciMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let fiamme = []
    let braci = []
    let raf = 0
    let ultimo = 0
    let visibile = true

    const ridimensiona = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Avanza la simulazione di "passo" frame (1 = 60fps)
    const aggiorna = (passo) => {
      const maxFiamme = Math.floor((w / 4) * intensita)
      const maxBraci = Math.floor((w / 25) * intensita)
      while (fiamme.length < maxFiamme) fiamme.push(nuovaFiamma(w, h))
      if (braci.length < maxBraci && Math.random() < 0.25 * passo) braci.push(nuovaBrace(w, h))

      for (const f of fiamme) {
        f.vita += passo
        f.x += f.vx * passo
        f.y += f.vy * passo
      }
      for (const b of braci) {
        b.vita += passo
        b.y += b.vy * passo
        b.x += Math.sin(b.fase + b.vita * 0.05) * 0.4 * passo
      }
      fiamme = fiamme.filter((f) => f.vita < f.durata)
      braci = braci.filter((b) => b.vita < b.durata && b.y > -10)
    }

    const disegna = () => {
      ctx.clearRect(0, 0, w, h)

      // Bagliore di fondo del focolare
      const bagliore = ctx.createLinearGradient(0, h, 0, h * 0.35)
      bagliore.addColorStop(0, 'rgba(255, 120, 40, 0.35)')
      bagliore.addColorStop(1, 'rgba(255, 120, 40, 0)')
      ctx.fillStyle = bagliore
      ctx.fillRect(0, 0, w, h)

      // "lighter" somma i colori sovrapposti: il centro delle fiamme diventa più chiaro
      ctx.globalCompositeOperation = 'lighter'
      for (const f of fiamme) {
        const eta = f.vita / f.durata
        // Sprite stirato in verticale e sempre più stretto salendo: forma a lingua di fuoco
        const larghezza = f.r * 1.4 * (1 - eta * 0.7)
        const altezza = f.r * 2.6 * (1 - eta * 0.4)
        ctx.globalAlpha = (1 - eta) * 0.5
        ctx.drawImage(spriteDellaFiamma(sprites, eta), f.x - larghezza / 2, f.y - altezza / 2, larghezza, altezza)
      }
      for (const b of braci) {
        const eta = b.vita / b.durata
        // Tremolio: le braci pulsano mentre salgono
        ctx.globalAlpha = (1 - eta) * (0.6 + Math.sin(b.vita * 0.3 + b.fase) * 0.4)
        const r = b.size * 3
        ctx.drawImage(sprites[0], b.x - r, b.y - r, r * 2, r * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const frame = (ora) => {
      // Passo normalizzato a 60fps e limitato, così dopo una pausa non c'è un salto
      const passo = Math.min((ora - ultimo) / 16.67, 3)
      ultimo = ora
      aggiorna(passo)
      disegna()
      raf = requestAnimationFrame(frame)
    }

    const avvia = () => {
      if (riduciMovimento || !visibile || raf) return
      ultimo = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const ferma = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    ridimensiona()
    const resizeObserver = new ResizeObserver(() => {
      ridimensiona()
      if (riduciMovimento) disegna()
    })
    resizeObserver.observe(canvas)

    // Fuori dallo schermo l'animazione si ferma
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visibile = entry.isIntersecting
      if (visibile) avvia()
      else ferma()
    })
    visibilityObserver.observe(canvas)

    // Avvio "a caldo": si simula un secondo e mezzo di fuoco, così le fiamme non nascono tutte insieme.
    // Con reduced motion resta questo unico fotogramma fermo.
    for (let i = 0; i < 90; i++) aggiorna(1)
    disegna()
    avvia()

    return () => {
      ferma()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [intensita])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
  )
}
