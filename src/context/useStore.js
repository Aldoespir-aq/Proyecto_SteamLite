import { useContext } from 'react'
import { StoreContext } from './StoreContext'

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore debe utilizarse dentro de StoreProvider.')
  return context
}
