import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.unstubAllGlobals()
})
