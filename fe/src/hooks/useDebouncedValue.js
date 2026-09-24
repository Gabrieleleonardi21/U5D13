import { useEffect, useState } from 'react'

/** Restituisce `value` solo dopo `delay` ms senza modifiche: evita una richiesta a ogni tasto. */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
