import { useEffect, useRef } from 'react'

// Texture di carta fatta a mano, ispirata a "Paper" di shadcn.io/background.
// Canvas 2D statico: grana fine + fibre sottili sopra il colore --background del body.
// Viene ridisegnata solo al resize, quindi non consuma CPU mentre si usa l'app.

// Generatore pseudo-casuale con seme: la texture resta identica tra un resize e l'altro
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function disegnaCarta(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const rand = rng(42)

  // 1. Grana: puntini chiari e scuri a bassissima opacità
  const granelli = Math.floor((w * h) / 90)
  for (let i = 0; i < granelli; i++) {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.35)'
    if (rand() < 0.55) ctx.fillStyle = 'rgba(70, 45, 20, 0.07)'
    ctx.fillRect(rand() * w, rand() * h, 1, 1)
  }

  // 2. Fibre: brevi curve color seppia, orientate in modo casuale
  const fibre = Math.floor((w * h) / 2600)
  ctx.lineCap = 'round'
  for (let i = 0; i < fibre; i++) {
    const x = rand() * w
    const y = rand() * h
    const len = 6 + rand() * 22
    const ang = rand() * Math.PI
    ctx.strokeStyle = `rgba(95, 62, 30, ${0.04 + rand() * 0.07})`
    ctx.lineWidth = 0.4 + rand() * 0.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.cos(ang + 0.6) * len * 0.5,
      y + Math.sin(ang + 0.6) * len * 0.5,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    )
    ctx.stroke()
  }

  // 3. Vignettatura leggera ai bordi, come un foglio invecchiato
  const vignetta = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8)
  vignetta.addColorStop(0, 'rgba(120, 80, 40, 0)')
  vignetta.addColorStop(1, 'rgba(120, 80, 40, 0.12)')
  ctx.fillStyle = vignetta
  ctx.fillRect(0, 0, w, h)
}

export function Paper() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let timer
    const ridisegna = () => {
      clearTimeout(timer)
      timer = setTimeout(() => disegnaCarta(canvas), 150)
    }
    disegnaCarta(canvas)
    window.addEventListener('resize', ridisegna)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', ridisegna)
    }
  }, [])

  // Decorativo: nascosto agli screen reader e trasparente ai click
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 size-full" />
}
