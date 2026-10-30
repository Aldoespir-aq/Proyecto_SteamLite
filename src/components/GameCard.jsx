import { Link } from 'react-router-dom'
import { useStore } from '../context/useStore'

const money = (price) => price === 0 ? 'Gratis' : `$${price.toFixed(2)}`

export default function GameCard({ game }) {
  const { cart, library, addToCart, claimFreeGame } = useStore()
  const owned = library.includes(game.id)
  const inCart = cart.includes(game.id)

  return (
    <article className="game-card">
      <Link to={`/game/${game.id}`} className="game-art-link" aria-label={`Ver ${game.title}`}>
        <img className="game-art" src={game.image} alt="" loading="lazy" />
        {game.tag && <span className="game-tag">{game.tag}</span>}
        <span className="art-shade" />
      </Link>
      <div className="game-card-info">
        <div className="game-title-row">
          <Link to={`/game/${game.id}`} className="game-title">{game.title}</Link>
          <span className="game-rating">★ {game.rating}</span>
        </div>
        <p className="game-category">{game.category}</p>
        <div className="game-card-bottom">
          <span className="game-price">{money(game.price)}</span>
          {owned
            ? <Link className="small-action owned-action" to={`/play/${game.id}`}>Jugar</Link>
            : <button className="small-action" onClick={() => game.price === 0 ? claimFreeGame(game.id) : addToCart(game.id)} disabled={game.price > 0 && inCart} aria-label={game.price === 0 ? `Obtener ${game.title}` : `Añadir ${game.title} al carrito`}>
                {game.price === 0 ? 'Obtener y jugar' : inCart ? 'En carrito' : 'Añadir +'}
              </button>}
        </div>
      </div>
    </article>
  )
}
