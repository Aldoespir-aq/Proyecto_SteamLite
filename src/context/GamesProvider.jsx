import { useCallback, useEffect, useMemo, useState } from 'react'
import { GamesContext } from './GamesContext'

export function GamesProvider({ children }) {
  const [games, setGames] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${import.meta.env.BASE_URL}games.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Error al cargar el catálogo: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('El catálogo no tiene el formato esperado.')
        setGames(data)
        setStatus('success')
        setError('')
      })
      .catch((cause) => {
        if (cause.name === 'AbortError') return
        console.error('No se pudo cargar el catálogo de SteamLite.', cause)
        setStatus('error')
        setError('No se pudo cargar el catálogo. Comprueba tu conexión e inténtalo de nuevo.')
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setError('')
    setAttempt((current) => current + 1)
  }, [])

  const value = useMemo(() => ({ games, status, error, retry }), [games, status, error, retry])

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
}
