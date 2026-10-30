import { useEffect, useMemo, useState } from 'react'
import { StoreContext } from './StoreContext'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch (error) {
    console.error(`No se pudo leer ${key} desde localStorage.`, error)
    return []
  }
}

function persistList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage.`, error)
  }
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => readList('steamlite-cart'))
  const [library, setLibrary] = useState(() => readList('steamlite-library'))
  const [notice, setNotice] = useState('')

  useEffect(() => persistList('steamlite-cart', cart), [cart])
  useEffect(() => persistList('steamlite-library', library), [library])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const value = useMemo(() => ({
    cart,
    library,
    notice,
    dismissNotice: () => setNotice(''),
    addToCart: (id) => {
      if (library.includes(id)) return
      if (cart.includes(id)) {
        setNotice('Este juego ya está en tu carrito.')
        return
      }
      setNotice('Juego añadido al carrito.')
      setCart((current) => current.includes(id) ? current : [...current, id])
    },
    claimFreeGame: (id) => {
      if (library.includes(id)) return
      setNotice('Juego añadido a tu biblioteca. ¡A jugar!')
      setLibrary((current) => current.includes(id) ? current : [...current, id])
      setCart((current) => current.filter((gameId) => gameId !== id))
    },
    removeFromCart: (id) => {
      if (!cart.includes(id)) return
      setNotice('Juego eliminado del carrito.')
      setCart((current) => current.filter((gameId) => gameId !== id))
    },
    purchaseCart: () => {
      setLibrary((current) => [...new Set([...current, ...cart])])
      setCart([])
    },
  }), [cart, library, notice])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
