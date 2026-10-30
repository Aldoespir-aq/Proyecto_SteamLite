import { useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { StoreProvider } from './context/StoreProvider'
import { useStore } from './context/useStore'
import { GamesProvider } from './context/GamesProvider'
import { useGames } from './context/useGames'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GameCard from './components/GameCard'
import { miniGames } from './components/miniGameRegistry'
import './App.css'

const money = (price) => `$${price.toFixed(2)}`
const categories = ['Todos', 'Acción', 'Aventura', 'Carreras', 'Indie', 'Casual']
const checkoutSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Escribe tu nombre completo.').required('Este campo es obligatorio.'),
  email: Yup.string().email('Introduce un correo válido.').required('Este campo es obligatorio.'),
  card: Yup.string().test('card-number', 'Introduce un número de tarjeta válido de 16 dígitos.', (value) => (value ?? '').replace(/\s/g, '').match(/^\d{16}$/) !== null).required('Este campo es obligatorio.'),
  expiry: Yup.string()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA.')
    .test('future-expiry', 'La tarjeta ya venció.', (value) => {
      if (!value || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return true
      const [month, year] = value.split('/').map(Number)
      const currentDate = new Date()
      const fullYear = 2000 + year
      return fullYear > currentDate.getFullYear()
        || (fullYear === currentDate.getFullYear() && month >= currentDate.getMonth() + 1)
    })
    .required('Este campo es obligatorio.'),
  cvc: Yup.string().matches(/^\d{3,4}$/, 'El código debe tener 3 o 4 dígitos.').required('Este campo es obligatorio.'),
})

function Catalog({ games }) {
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [featuredIndex, setFeaturedIndex] = useState(0)

  const filteredGames = games.filter((game) => (
    (category === 'Todos' || game.category === category)
    && `${game.title} ${game.category}`.toLowerCase().includes(query.toLowerCase().trim())
  ))
  const featuredGames = games.filter((game) => game.tag)
  const featured = featuredGames[featuredIndex] ?? games[1]
  const moveFeatured = (step) => {
    if (featuredGames.length < 2) return
    setFeaturedIndex((current) => (current + step + featuredGames.length) % featuredGames.length)
  }

  return (
    <main className="page-shell">
      <section className="hero" aria-roledescription="carrusel" aria-label="Juegos destacados" style={{ backgroundImage: `url("${featured?.image ?? ''}")` }}>
        <div className="hero-content">
          <span className="eyebrow"><span className="live-dot" /> TU PRÓXIMA AVENTURA EMPIEZA AQUÍ</span>
          <h1>Encuentra tu<br /><span>siguiente mundo.</span></h1>
          <p>Juegos increíbles. Nuevas historias. Todo en un solo lugar.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#catalogo">Explorar juegos <span>↘</span></a>
            <Link className="button button-ghost" to="/library">Mi biblioteca</Link>
          </div>
          <div className="hero-footnote"><span>✦</span> Descubre algo nuevo cada día</div>
        </div>
        <div className="hero-feature-card">
          <span>DESTACADOS PARA TI</span>
          <strong>{featured?.title ?? 'Neon Rivals'}</strong>
          <small>★ {featured?.rating ?? '4.8'} <i>·</i> {featured?.category ?? 'Acción'}</small>
          {featuredGames.length > 1 && (
            <div className="hero-carousel-controls" aria-label="Controles de juegos destacados">
              <button type="button" onClick={() => moveFeatured(-1)} aria-label="Juego destacado anterior">←</button>
              <div className="carousel-dots">
                {featuredGames.map((game, index) => (
                  <button key={game.id} type="button" className={index === featuredIndex ? 'active' : ''} onClick={() => setFeaturedIndex(index)} aria-label={`Mostrar ${game.title}`} aria-current={index === featuredIndex ? 'true' : undefined} />
                ))}
              </div>
              <button type="button" onClick={() => moveFeatured(1)} aria-label="Siguiente juego destacado">→</button>
            </div>
          )}
        </div>
      </section>

      <section id="catalogo" className="catalog-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted-eyebrow">ELIGE TU AVENTURA</span>
            <h2>Explora el catálogo<span className="heading-period">.</span></h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar juegos..." aria-label="Buscar juegos" />
            <kbd>⌘ K</kbd>
          </label>
        </div>
        <div className="catalog-toolbar">
          <div className="category-list" aria-label="Filtrar por género">
            {categories.map((item) => (
              <button key={item} className={`category-chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <span className="results-count">{filteredGames.length} juegos</span>
        </div>
        {filteredGames.length > 0
          ? <div className="game-grid">{filteredGames.map((game) => <GameCard key={game.id} game={game} />)}</div>
          : <div className="empty-state"><span>⌕</span><h3>No encontramos ese juego</h3><p>Prueba otra búsqueda o selecciona otra categoría.</p></div>}
      </section>

      <section className="perks-row">
        <div><span className="perk-icon">◈</span><div><strong>Descubre</strong><small>Juegos para cada estilo</small></div></div>
        <div><span className="perk-icon">▣</span><div><strong>Compra segura</strong><small>Checkout protegido</small></div></div>
        <div><span className="perk-icon">✦</span><div><strong>Juega al instante</strong><small>Tu biblioteca, siempre contigo</small></div></div>
      </section>
    </main>
  )
}

function GameDetails({ games }) {
  const { id } = useParams()
  const game = games.find((item) => item.id === id)
  const { cart, library, addToCart, claimFreeGame } = useStore()
  const [activeScreenshot, setActiveScreenshot] = useState(null)

  if (!game) return <NotFound />
  const owned = library.includes(game.id)
  const inCart = cart.includes(game.id)

  return (
    <main className="page-shell detail-page">
      <Link to="/" className="back-link">← Volver a explorar</Link>
      <div className="detail-hero" style={{ backgroundImage: `url("${game.image}")` }}>
        <div className="detail-hero-overlay" />
        <div className="detail-hero-copy">
          <span className="eyebrow">{game.category.toUpperCase()} <i>·</i> STEAMLITE ORIGINALS</span>
          <h1>{game.title}</h1>
          <p>★ {game.rating} <span>({game.reviews.toLocaleString()} reseñas)</span></p>
        </div>
      </div>
      <div className="detail-layout">
        <section className="detail-description">
          <span className="eyebrow muted-eyebrow">ACERCA DEL JUEGO</span>
          <h2>Una experiencia<br />hecha para ti<span className="heading-period">.</span></h2>
          <p>{game.description}</p>
          <div className="detail-stats">
            <div><span>GÉNERO</span><strong>{game.category}</strong></div>
            <div><span>VALORACIÓN</span><strong>★ {game.rating} / 5</strong></div>
            <div><span>RESEÑAS</span><strong>{game.reviews.toLocaleString()}</strong></div>
          </div>
        </section>
        <aside className="purchase-panel">
          <img src={game.image} alt="" />
          <div className="purchase-panel-body">
            <span className="eyebrow muted-eyebrow">DISPONIBLE AHORA</span>
            <h3>{game.title}</h3>
            <div className="purchase-bottom"><strong>{game.price === 0 ? 'Gratis' : money(game.price)}</strong>
              {owned
                ? <Link className="button button-primary" to={`/play/${game.id}`}>Jugar ahora <span>→</span></Link>
                : <button className="button button-primary" onClick={() => game.price === 0 ? claimFreeGame(game.id) : addToCart(game.id)} disabled={game.price > 0 && inCart}>
                    {game.price === 0 ? 'Obtener y jugar' : inCart ? 'En tu carrito ✓' : 'Añadir al carrito'}
                  </button>}
            </div>
            {owned && <p className="owned-hint">✓ Este juego ya está en tu biblioteca</p>}
          </div>
        </aside>
      </div>
      <section className="screenshot-section">
        <span className="eyebrow muted-eyebrow">UN VISTAZO AL JUEGO</span>
        <h2>Galería visual<span className="heading-period">.</span></h2>
        <p className="gallery-disclaimer">Imágenes ilustrativas de la temática; no son capturas reales del minijuego.</p>
        <div className="screenshot-grid">
          {game.screenshots.map((screenshot, index) => (
            <button key={screenshot} className="screenshot-button" onClick={() => setActiveScreenshot(screenshot)} aria-label={`Ampliar captura ${index + 1} de ${game.title}`}>
              <img src={screenshot} alt={`Imagen ilustrativa de ${game.title}, ${index + 1}`} loading="lazy" />
              <span>Ampliar imagen ↗</span>
            </button>
          ))}
        </div>
      </section>
      <section className="review-section">
        <span className="eyebrow muted-eyebrow">LO QUE DICE LA COMUNIDAD</span>
        <h2>Reseñas destacadas<span className="heading-period">.</span></h2>
        <p className="review-disclaimer">Opiniones de demostración incluidas con el proyecto; no son reseñas enviadas por usuarios.</p>
        <div className="review-list">
          {game.userReviews.map((review) => (
            <article className="review-card" key={review.name}>
              <div className="review-avatar">{review.name.slice(0, 1)}</div>
              <div><strong>{review.name} <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></strong><p>{review.comment}</p></div>
            </article>
          ))}
        </div>
      </section>
      {activeScreenshot && (
        <div className="screenshot-modal" role="dialog" aria-modal="true" aria-label={`Captura de ${game.title}`} onClick={() => setActiveScreenshot(null)}>
          <button className="screenshot-close" onClick={() => setActiveScreenshot(null)} aria-label="Cerrar captura">×</button>
          <img src={activeScreenshot} alt={`Imagen ilustrativa ampliada de ${game.title}`} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  )
}

function CheckoutForm({ onSuccess }) {
  return (
    <Formik initialValues={{ name: '', email: '', card: '', expiry: '', cvc: '' }} validationSchema={checkoutSchema} onSubmit={onSuccess}>
      {({ errors, touched, isSubmitting, submitCount }) => (
        <Form className="checkout-form">
          <div className="checkout-form-heading"><span className="eyebrow muted-eyebrow">PAGO SIMULADO</span><span className="secure-label">▣ PAGO SEGURO</span></div>
          {submitCount > 0 && Object.keys(errors).length > 0 && (
            <p className="checkout-error-summary" role="alert">
              Revisa los campos marcados para poder continuar con el pago.
            </p>
          )}
          <div className="form-grid">
            <label className="form-field full-field">Nombre en la tarjeta<Field name="name" autoComplete="cc-name" placeholder="Alex Morgan" aria-invalid={Boolean(errors.name && (touched.name || submitCount))} aria-describedby={errors.name && (touched.name || submitCount) ? 'checkout-name-error' : undefined} />{errors.name && (touched.name || submitCount) && <small id="checkout-name-error">{errors.name}</small>}</label>
            <label className="form-field full-field">Correo electrónico<Field name="email" type="email" autoComplete="email" placeholder="alex@email.com" aria-invalid={Boolean(errors.email && (touched.email || submitCount))} aria-describedby={errors.email && (touched.email || submitCount) ? 'checkout-email-error' : undefined} />{errors.email && (touched.email || submitCount) && <small id="checkout-email-error">{errors.email}</small>}</label>
            <label className="form-field full-field">Número de tarjeta
              <Field name="card">
                {({ field, form }) => (
                  <input
                    {...field}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength="19"
                    placeholder="4242 4242 4242 4242"
                    aria-invalid={Boolean(errors.card && (touched.card || submitCount))}
                    aria-describedby={errors.card && (touched.card || submitCount) ? 'checkout-card-error' : undefined}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '').slice(0, 16)
                      form.setFieldValue(field.name, digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                    }}
                  />
                )}
              </Field>
              {errors.card && (touched.card || submitCount) && <small id="checkout-card-error">{errors.card}</small>}
            </label>
            <label className="form-field">Vencimiento
              <Field name="expiry">
                {({ field, form }) => (
                  <input
                    {...field}
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    maxLength="5"
                    placeholder="MM/AA"
                    aria-invalid={Boolean(errors.expiry && (touched.expiry || submitCount))}
                    aria-describedby={errors.expiry && (touched.expiry || submitCount) ? 'checkout-expiry-error' : undefined}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                      const value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
                      form.setFieldValue(field.name, value)
                    }}
                  />
                )}
              </Field>
              <span className="field-hint">Mes/año. Ejemplo: 12/29.</span>
              {errors.expiry && (touched.expiry || submitCount) && <small id="checkout-expiry-error">{errors.expiry}</small>}
            </label>
            <label className="form-field">CVC<Field name="cvc" inputMode="numeric" autoComplete="cc-csc" maxLength="4" placeholder="123" aria-invalid={Boolean(errors.cvc && (touched.cvc || submitCount))} aria-describedby={errors.cvc && (touched.cvc || submitCount) ? 'checkout-cvc-error' : undefined} />{errors.cvc && (touched.cvc || submitCount) && <small id="checkout-cvc-error">{errors.cvc}</small>}</label>
          </div>
          <p className="demo-notice">Esta es una demostración. No se realizará ningún cargo.</p>
          <button className="button button-primary checkout-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando pago…' : 'Confirmar pago'} <span>→</span>
          </button>
        </Form>
      )}
    </Formik>
  )
}

function Cart({ games }) {
  const { cart, removeFromCart, purchaseCart } = useStore()
  const [complete, setComplete] = useState(false)
  const navigate = useNavigate()
  const items = games.filter((game) => cart.includes(game.id))
  const total = items.reduce((sum, game) => sum + game.price, 0)

  const handleSuccess = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    purchaseCart()
    setComplete(true)
  }

  if (complete) {
    return <main className="page-shell"><div className="success-panel"><span className="success-mark">✓</span><span className="eyebrow muted-eyebrow">COMPRA COMPLETADA</span><h1>¡Ya es tuyo<span className="heading-period">!</span></h1><p>Tus juegos están listos y te esperan en tu biblioteca.</p><button className="button button-primary" onClick={() => navigate('/library')}>Ir a mi biblioteca <span>→</span></button></div></main>
  }

  return (
    <main className="page-shell cart-page">
      <span className="eyebrow muted-eyebrow">TU SELECCIÓN</span>
      <h1>Tu carrito<span className="heading-period">.</span></h1>
      {items.length === 0
        ? <div className="empty-state cart-empty"><span>▱</span><h3>Tu próxima aventura te espera</h3><p>Aún no has añadido juegos al carrito.</p><Link className="button button-primary" to="/">Explorar juegos <span>→</span></Link></div>
        : <div className="cart-layout">
            <section className="cart-items"><div className="cart-list-heading"><span>JUEGO</span><span>PRECIO</span></div>
              {items.map((game) => <article className="cart-item" key={game.id}>
                <img src={game.image} alt="" />
                <div className="cart-item-info"><Link to={`/game/${game.id}`}>{game.title}</Link><span>{game.category}</span><button onClick={() => removeFromCart(game.id)}>Eliminar</button></div>
                <strong>{game.price === 0 ? 'Gratis' : money(game.price)}</strong>
              </article>)}
            </section>
            <aside className="order-summary"><span className="eyebrow muted-eyebrow">RESUMEN DEL PEDIDO</span><h2>Tu compra</h2><div className="summary-line"><span>Subtotal ({items.length} {items.length === 1 ? 'juego' : 'juegos'})</span><span>{money(total)}</span></div><div className="summary-line"><span>Impuestos</span><span>Incluidos</span></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
              <CheckoutForm onSuccess={handleSuccess} />
            </aside>
          </div>}
    </main>
  )
}

function Library({ games: catalogGames }) {
  const { library } = useStore()
  const games = catalogGames.filter((game) => library.includes(game.id))

  return (
    <main className="page-shell library-page">
      <span className="eyebrow muted-eyebrow">TU COLECCIÓN PERSONAL</span>
      <h1>Mi biblioteca<span className="heading-period">.</span></h1>
      <p className="page-intro">Todos tus mundos, reunidos en un solo lugar.</p>
      {games.length
        ? <div className="game-grid library-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div>
        : <div className="empty-state"><span>✧</span><h3>Tu biblioteca está esperando</h3><p>Cuando encuentres un juego que te guste, estará aquí.</p><Link to="/" className="button button-primary">Descubrir juegos <span>→</span></Link></div>}
    </main>
  )
}

function Play({ games }) {
  const { id } = useParams()
  const game = games.find((item) => item.id === id)
  const { library } = useStore()

  if (!game) return <NotFound />
  if (!library.includes(id)) return <main className="page-shell"><div className="empty-state"><span>🔒</span><h3>Este juego aún no está en tu biblioteca</h3><p>Añádelo a tu colección para empezar a jugar.</p><Link to={`/game/${id}`} className="button button-primary">Ver juego <span>→</span></Link></div></main>
  const miniGame = miniGames[game.gameType]
  if (!miniGame) return <main className="page-shell"><div className="empty-state"><span>!</span><h3>Minijuego no disponible</h3><p>Este juego todavía no tiene una modalidad implementada.</p><Link to="/library" className="button button-primary">Volver a mi biblioteca <span>→</span></Link></div></main>
  const MiniGame = miniGame.Component

  return (
    <main className="page-shell play-page">
      <Link to="/library" className="back-link">← Volver a mi biblioteca</Link>
      <div className="play-heading"><div><span className="eyebrow muted-eyebrow">STEAMLITE ARCADE · JUGANDO AHORA</span><h1>{game.title}</h1></div><span className="online-indicator"><i /> SESIÓN LOCAL</span></div>
      <section className="arcade-frame">
        <div className="arcade-topbar"><span><i /> EN JUEGO</span><span>{miniGame.title}</span><span>STEAMLITE ARCADE</span></div>
        <div className="game-overview">
          <div><span className="game-overview-label">OBJETIVO</span><p>{miniGame.objective}</p></div>
          <div><span className="game-overview-label">CÓMO JUGAR</span><p>{miniGame.controls}</p></div>
        </div>
        <MiniGame recordKey={game.id} />
      </section>
    </main>
  )
}

function NotFound() {
  return <main className="page-shell"><div className="empty-state"><span>404</span><h3>Este mundo no existe</h3><p>El juego que buscas no está disponible.</p><Link to="/" className="button button-primary">Volver al inicio <span>→</span></Link></div></main>
}

function AppRoutes() {
  const { games, status, error, retry } = useGames()
  const { notice, dismissNotice } = useStore()

  return (
    <div className="app">
      <Navbar />
      {notice && <div className="store-notice" role="status" aria-live="polite"><span>{notice}</span><button type="button" onClick={dismissNotice} aria-label="Cerrar notificación">×</button></div>}
      {status === 'loading'
        ? <main className="page-shell"><div className="empty-state" role="status"><span>◌</span><h3>Cargando juegos…</h3><p>Estamos preparando el catálogo.</p></div></main>
        : status === 'error'
          ? <main className="page-shell"><div className="empty-state" role="alert"><span>!</span><h3>No pudimos abrir el catálogo</h3><p>{error}</p><button className="button button-primary" onClick={retry}>Reintentar</button></div></main>
          : <Routes>
              <Route path="/" element={<Catalog games={games} />} />
              <Route path="/game/:id" element={<GameDetails games={games} />} />
              <Route path="/cart" element={<Cart games={games} />} />
              <Route path="/library" element={<Library games={games} />} />
              <Route path="/play/:id" element={<Play games={games} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>}
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <GamesProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StoreProvider>
    </GamesProvider>
  )
}
