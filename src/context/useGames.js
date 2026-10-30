import { useContext } from 'react'
import { GamesContext } from './GamesContext'

export function useGames() {
  const context = useContext(GamesContext)
  if (!context) throw new Error('useGames debe utilizarse dentro de GamesProvider.')
  return context
}
