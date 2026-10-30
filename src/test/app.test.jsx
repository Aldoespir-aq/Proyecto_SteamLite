import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

const games = JSON.parse(readFileSync(resolve(process.cwd(), 'public', 'games.json'), 'utf8'))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => games,
  })))
})

describe('SteamLite', () => {
  it('carga portadas locales y filtra el catálogo por género', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    await screen.findByRole('heading', { name: /Explora el catálogo/ })
    expect(container.querySelectorAll('.game-art')).toHaveLength(games.length)
    expect([...container.querySelectorAll('.game-art')].every((image) => image.getAttribute('src').startsWith('/games/'))).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Acción' }))

    expect(screen.getByText('1 juegos')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver Neon Rivals' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Ver Wildwood' })).toBeNull()
  })

  it('permite obtener un juego gratuito y abrir su minijuego', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Obtener Starlight Drift' }))
    expect(await screen.findByText('Juego añadido a tu biblioteca. ¡A jugar!')).toBeTruthy()

    await user.click(screen.getByRole('link', { name: 'Jugar' }))

    expect(await screen.findByRole('heading', { name: 'Starlight Drift' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Carta oculta' })).toHaveLength(12)
  })

  it('muestra errores al enviar el checkout vacío', async () => {
    const user = userEvent.setup()
    localStorage.setItem('steamlite-cart', JSON.stringify(['neon-rivals']))
    window.history.replaceState({}, '', '/cart')
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Confirmar pago/ }))
    await user.type(screen.getByPlaceholderText('alex@email.com'), 'correo-invalido')

    expect((await screen.findByRole('alert')).textContent).toContain('Revisa los campos marcados')
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(4)
    expect(screen.getByText('Introduce un correo válido.')).toBeTruthy()
  })

  it('completa una compra simulada y persiste el juego en la biblioteca', async () => {
    const user = userEvent.setup()
    localStorage.setItem('steamlite-cart', JSON.stringify(['neon-rivals']))
    window.history.replaceState({}, '', '/cart')
    render(<App />)

    await screen.findByText('Neon Rivals')
    await user.type(screen.getByPlaceholderText('Alex Morgan'), 'Alex Morgan')
    await user.type(screen.getByPlaceholderText('alex@email.com'), 'alex@example.com')
    await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), '4242424242424242')
    await user.type(screen.getByPlaceholderText('MM/AA'), '1229')
    await user.type(screen.getByPlaceholderText('123'), '123')
    await user.click(screen.getByRole('button', { name: /Confirmar pago/ }))

    expect(await screen.findByRole('heading', { name: '¡Ya es tuyo!' })).toBeTruthy()
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('steamlite-library'))).toContain('neon-rivals')
      expect(JSON.parse(localStorage.getItem('steamlite-cart'))).toEqual([])
    })

    await user.click(screen.getByRole('button', { name: /Ir a mi biblioteca/ }))
    expect(await screen.findByRole('link', { name: 'Jugar' })).toBeTruthy()
  })
})
