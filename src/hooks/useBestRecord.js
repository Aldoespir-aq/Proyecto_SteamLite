import { useCallback, useEffect, useState } from 'react'

function readRecord(key, fallback) {
  try {
    const stored = Number(localStorage.getItem(key))
    return Number.isFinite(stored) && stored > 0 ? stored : fallback
  } catch (error) {
    console.error(`No se pudo leer el récord "${key}".`, error)
    return fallback
  }
}

export function useBestRecord(key, fallback, mode = 'lower') {
  const [record, setRecord] = useState(() => readRecord(key, fallback))

  useEffect(() => {
    if (record === fallback) return
    try {
      localStorage.setItem(key, String(record))
    } catch (error) {
      console.error(`No se pudo guardar el récord "${key}".`, error)
    }
  }, [fallback, key, record])

  const saveRecord = useCallback((value) => {
    setRecord((current) => {
      const improvesRecord = mode === 'higher'
        ? value > current
        : current === fallback || value < current
      return improvesRecord ? value : current
    })
  }, [fallback, mode])

  return [record, saveRecord]
}
