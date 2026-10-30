import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/useStore'

export default function Navbar() {
  const { cart } = useStore()

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link className="brand" to="/" aria-label="SteamLite, inicio">
          <span className="brand-mark">S</span>
          <span>steam<span className="brand-light">lite</span></span>
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          <NavLink to="/" end>Explorar</NavLink>
          <NavLink to="/library">Biblioteca</NavLink>
        </nav>
        <NavLink className="cart-link" to="/cart" aria-label={`Carrito, ${cart.length} juegos`}>
          <span aria-hidden="true">▱</span>
          <span>Carrito</span>
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </NavLink>
      </div>
    </header>
  )
}
