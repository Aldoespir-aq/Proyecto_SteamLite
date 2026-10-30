import { useEffect, useRef, useState, useCallback } from 'react'
import { useBestRecord } from '../hooks/useBestRecord'
import { playSound } from '../utils/sound'

const winningLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const randomIndex = (length) => Math.floor(Math.random() * length)

// ==========================================
// 1. JUEGO DE MEMORIA (STARLIGHT DRIFT)
// ==========================================
export function MemoryGame({ recordKey = 'memory' }) {
  const symbols = ['✦', '◈', '☾', '♧', '✿', '⬡']
  const createCards = () => {
    const deck = [...symbols, ...symbols].map((symbol, index) => ({ id: index, symbol }))
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1)
      ;[deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]]
    }
    return deck
  }
  const [cards, setCards] = useState(createCards)
  const [open, setOpen] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestMoves, saveBestMoves] = useBestRecord(`${recordKey}-best-moves`, 0)
  const complete = matched.length === cards.length

  useEffect(() => {
    if (open.length !== 2 || matched.includes(open[0])) return undefined
    const timeout = window.setTimeout(() => setOpen([]), 750)
    return () => window.clearTimeout(timeout)
  }, [open, matched])

  useEffect(() => {
    if (!started || complete) return undefined
    const interval = window.setInterval(() => setSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(interval)
  }, [started, complete])

  useEffect(() => {
    if (complete && moves > 0) {
      playSound('win')
      saveBestMoves(moves)
    }
  }, [complete, moves, saveBestMoves])

  const flip = (index) => {
    if (open.length === 2 || open.includes(index) || matched.includes(index)) return
    playSound('flip')
    setStarted(true)
    if (open.length === 1) {
      const firstIndex = open[0]
      const nextMoves = moves + 1
      setMoves(nextMoves)
      if (cards[firstIndex].symbol === cards[index].symbol) {
        playSound('match')
        setStreak((s) => s + 1)
        setMatched((current) => [...current, firstIndex, index])
      } else {
        playSound('wrong')
        setStreak(0)
      }
    }
    setOpen((current) => [...current, index])
  }

  const reset = () => {
    playSound('click')
    setCards(createCards())
    setOpen([])
    setMatched([])
    setMoves(0)
    setSeconds(0)
    setStreak(0)
    setStarted(false)
  }

  return (
    <div className="mini-game">
      <div className="game-hud">
        <div><span>PAREJAS</span><strong>{matched.length / 2}<small> / 6</small></strong></div>
        <div><span>MOVIMIENTOS</span><strong>{moves}</strong></div>
        <div><span>RACHA</span><strong>{streak ? `🔥 x${streak}` : '—'}</strong></div>
        <div><span>TIEMPO</span><strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></div>
        <div><span>RÉCORD</span><strong>{bestMoves || '—'}{bestMoves ? <small> mov.</small> : null}</strong></div>
      </div>
      <p className="game-status" aria-live="polite">
        {complete ? '🎉 ¡Tablero galáctico resuelto! ¿Puedes mejorar tu récord?' : started ? 'Observa y empareja las constelaciones.' : 'Encuentra las seis parejas con el menor número de movimientos.'}
      </p>
      <div className="memory-board">
        {cards.map((card, index) => {
          const isFlipped = open.includes(index) || matched.includes(index)
          const isMatched = matched.includes(index)
          return (
            <button
              key={card.id}
              disabled={isMatched}
              className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => flip(index)}
              aria-label={isFlipped ? card.symbol : 'Carta oculta'}
            >
              <span className="card-face card-front">{card.symbol}</span>
              <span className="card-face card-back">✧</span>
            </button>
          )
        })}
      </div>
      <button className="text-button" onClick={reset}>↻ Nueva partida</button>
    </div>
  )
}

// ==========================================
// 2. TRES EN RAYA CYBERPUNK (NEON RIVALS)
// ==========================================
export function TicTacToe({ recordKey = 'tic-tac-toe' }) {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [turn, setTurn] = useState('X')
  const [difficulty, setDifficulty] = useState('pro') // 'classic' | 'pro' (minimax)
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 })
  const [bestWins, saveBestWins] = useBestRecord(`${recordKey}-best-wins`, 0, 'higher')
  const lastScoredBoard = useRef('')

  const winningLineMatch = winningLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])
  const winner = winningLineMatch ? winningLineMatch : null
  const draw = !winner && board.every(Boolean)
  const finished = Boolean(winner || draw)

  useEffect(() => {
    if (finished && winner) {
      const boardKey = board.join('')
      if (lastScoredBoard.current === boardKey) return
      lastScoredBoard.current = boardKey
      const isPlayerWin = board[winner[0]] === 'X'
      if (isPlayerWin) {
        playSound('win')
      } else {
        playSound('lose')
      }
      setScore((current) => ({
        ...current,
        [isPlayerWin ? 'wins' : 'losses']: current[isPlayerWin ? 'wins' : 'losses'] + 1,
      }))
    } else if (draw) {
      const boardKey = board.join('')
      if (lastScoredBoard.current === boardKey) return
      lastScoredBoard.current = boardKey
      playSound('wrong')
      setScore((current) => ({ ...current, draws: current.draws + 1 }))
    }
  }, [board, draw, finished, winner])

  useEffect(() => {
    if (turn !== 'O' || finished) return undefined
    const timeout = window.setTimeout(() => {
      const move = difficulty === 'pro' ? chooseSmartMove(board) : chooseComputerMove(board)
      playSound('move')
      setBoard((current) => current.map((cell, index) => index === move ? 'O' : cell))
      setTurn('X')
    }, 380)
    return () => window.clearTimeout(timeout)
  }, [board, finished, turn, difficulty])

  useEffect(() => {
    saveBestWins(score.wins)
  }, [score.wins, saveBestWins])

  const status = winner
    ? board[winner[0]] === 'X' ? '⚡ ¡Victoria Cyberpunk! Dominaste la red.' : '🤖 La IA de Neon Rivals se anticipó.'
    : draw ? '⚡ Empate técnico en la red.' : turn === 'X' ? 'Tu turno · Coloca tu pulso [X]' : 'IA calculando contramedida…'

  const play = (index) => {
    if (board[index] || finished || turn !== 'X') return
    playSound('move')
    setBoard((current) => current.map((cell, cellIndex) => cellIndex === index ? 'X' : cell))
    setTurn('O')
  }

  const reset = () => {
    playSound('click')
    lastScoredBoard.current = ''
    setBoard(Array(9).fill(''))
    setTurn('X')
  }

  return (
    <div className="mini-game">
      <div className="game-hud">
        <div><span>VICTORIAS</span><strong>{score.wins}</strong></div>
        <div><span>EMPATES</span><strong>{score.draws}</strong></div>
        <div><span>DERROTAS</span><strong>{score.losses}</strong></div>
        <div><span>RÉCORD</span><strong>{bestWins}</strong></div>
      </div>
      <div className="difficulty-selector">
        <span>MODO IA:</span>
        <button
          className={`pill-btn ${difficulty === 'classic' ? 'active' : ''}`}
          onClick={() => { playSound('click'); setDifficulty('classic') }}
        >
          Normal
        </button>
        <button
          className={`pill-btn ${difficulty === 'pro' ? 'active' : ''}`}
          onClick={() => { playSound('click'); setDifficulty('pro') }}
        >
          Experto IA
        </button>
      </div>
      <p className="game-status" aria-live="polite">{status}</p>
      <div className="tic-board">
        {board.map((cell, index) => {
          const isWinningCell = winner && winner.includes(index)
          return (
            <button
              key={index}
              disabled={Boolean(cell) || finished || turn !== 'X'}
              className={`tic-cell ${cell === 'X' ? 'mark-x' : cell === 'O' ? 'mark-o' : ''} ${isWinningCell ? 'winning-cell' : ''}`}
              onClick={() => play(index)}
              aria-label={`Casilla ${index + 1}: ${cell || 'vacía'}`}
            >
              {cell}
            </button>
          )
        })}
      </div>
      <button className="text-button" onClick={reset}>↻ Reiniciar partida</button>
    </div>
  )
}

function chooseSmartMove(board) {
  // Minimax inteligente para dificultad pro
  function evaluate(b) {
    for (const [x, y, z] of winningLines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        return b[x] === 'O' ? 10 : -10
      }
    }
    return 0
  }

  function minimax(b, depth, isMax) {
    const score = evaluate(b)
    if (score === 10 || score === -10) return score - (isMax ? depth : -depth)
    if (b.every(Boolean) || depth >= 4) return 0

    if (isMax) {
      let best = -1000
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O'
          best = Math.max(best, minimax(b, depth + 1, false))
          b[i] = ''
        }
      }
      return best
    } else {
      let best = 1000
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'X'
          best = Math.min(best, minimax(b, depth + 1, true))
          b[i] = ''
        }
      }
      return best
    }
  }

  let bestVal = -1000
  let bestMove = -1
  const copy = [...board]

  for (let i = 0; i < 9; i++) {
    if (!copy[i]) {
      copy[i] = 'O'
      const moveVal = minimax(copy, 0, false)
      copy[i] = ''
      if (moveVal > bestVal) {
        bestMove = i
        bestVal = moveVal
      }
    }
  }

  return bestMove >= 0 ? bestMove : chooseComputerMove(board)
}

function chooseComputerMove(board) {
  const findWinningMove = (symbol) => board.findIndex((cell, index) => {
    if (cell) return false
    const next = board.map((value, cellIndex) => cellIndex === index ? symbol : value)
    return winningLines.some(([a, b, c]) => next[a] === symbol && next[a] === next[b] && next[a] === next[c])
  })
  const win = findWinningMove('O')
  if (win >= 0) return win
  const block = findWinningMove('X')
  if (block >= 0) return block
  if (!board[4]) return 4
  const available = [0, 2, 6, 8].filter((index) => !board[index])
  const choices = available.length ? available : [1, 3, 5, 7].filter((index) => !board[index])
  return choices[randomIndex(choices.length)]
}

// ==========================================
// 3. NÚMERO SECRETO & BRÚJULA (WILDWOOD)
// ==========================================
export function NumberGuess() {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 50) + 1)
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('Adivina el número secreto entre 1 y 50.')
  const [proximity, setProximity] = useState('cold') // 'hot' | 'warm' | 'cold'
  const [finished, setFinished] = useState(false)
  const [lastHint, setLastHint] = useState('')
  const [bestAttempts, saveBestAttempts] = useBestRecord('number-guess-best-attempts', 0)

  const submitGuess = (event) => {
    event.preventDefault()
    const number = Number(guess)
    if (!Number.isInteger(number) || number < 1 || number > 50) {
      setMessage('Escribe un número entero entre 1 y 50.')
      playSound('wrong')
      return
    }
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setGuess('')

    const diff = Math.abs(number - target)
    let prox = 'cold'
    if (diff === 0) prox = 'exact'
    else if (diff <= 3) prox = 'hot'
    else if (diff <= 8) prox = 'warm'
    setProximity(prox)

    if (number === target) {
      playSound('win')
      setMessage(`🌿 ¡Hallazgo botánico! Encontraste el secreto en ${nextAttempts} ${nextAttempts === 1 ? 'intento' : 'intentos'}.`)
      setLastHint('¡Acertado!')
      saveBestAttempts(nextAttempts)
      setFinished(true)
      setHistory((prev) => [{ number, result: 'exact' }, ...prev])
    } else {
      playSound(diff <= 5 ? 'match' : 'move')
      const direction = number < target ? 'más alto ▲' : 'más bajo ▼'
      const distanceHint = diff <= 3 ? ' ¡Estás que ardes de cerca!' : diff <= 8 ? ' ¡Caliente, estás muy cerca!' : ''
      setMessage(`El número secreto es ${direction}.${distanceHint}`)
      setLastHint(`${number < target ? 'Mayor que' : 'Menor que'} ${number}`)
      setHistory((prev) => [{ number, result: number < target ? 'higher' : 'lower', diff }, ...prev])
    }
  }

  const reset = () => {
    playSound('click')
    setTarget(Math.floor(Math.random() * 50) + 1)
    setGuess('')
    setAttempts(0)
    setHistory([])
    setMessage('Adivina el número secreto entre 1 y 50.')
    setProximity('cold')
    setFinished(false)
    setLastHint('')
  }

  return (
    <div className="mini-game">
      <div className="game-hud">
        <div><span>RANGO</span><strong>1<small>–50</small></strong></div>
        <div><span>INTENTOS</span><strong>{attempts}</strong></div>
        <div><span>SENSOR TÉRMICO</span><strong className={`proximity-badge ${proximity}`}>{proximity === 'hot' ? '🔥 Muy cerca' : proximity === 'warm' ? '✨ Cerca' : proximity === 'exact' ? '🎯 ¡Éxito!' : '❄ Lejos'}</strong></div>
        <div><span>ÚLTIMA PISTA</span><strong className="compact-stat">{lastHint || '—'}</strong></div>
        <div><span>RÉCORD</span><strong>{bestAttempts || '—'}{bestAttempts ? <small> intentos</small> : null}</strong></div>
      </div>
      <p className="game-status" aria-live="polite">{message}</p>
      <form className="number-guess-form" onSubmit={submitGuess}>
        <label htmlFor="number-guess">Tu número</label>
        <input
          id="number-guess"
          type="number"
          min="1"
          max="50"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          disabled={finished}
          placeholder="1 - 50"
          autoFocus
        />
        <button className="button button-primary" type="submit" disabled={finished || !guess}>Probar</button>
      </form>
      {history.length > 0 && (
        <div className="guess-history">
          <span>HISTORIAL:</span>
          <div className="guess-tags">
            {history.slice(0, 7).map((item, idx) => (
              <span key={idx} className={`guess-tag ${item.result}`}>
                {item.number} {item.result === 'higher' ? '▲' : item.result === 'lower' ? '▼' : '★'}
              </span>
            ))}
          </div>
        </div>
      )}
      {finished && <button className="button button-secondary" onClick={reset}>↻ Nueva partida</button>}
    </div>
  )
}

// ==========================================
// 4. SEMÁFORO DE REFLEJOS F1 (TINY GRAND PRIX)
// ==========================================
export function ReactionGame() {
  const [phase, setPhase] = useState('idle') // 'idle' | 'countdown' | 'waiting' | 'ready' | 'result'
  const [lights, setLights] = useState([false, false, false, false, false])
  const [result, setResult] = useState('')
  const [currentMs, setCurrentMs] = useState(0)
  const [rank, setRank] = useState('')
  const startedAt = useRef(0)
  const countdownTimer = useRef(null)
  const [bestTime, saveBestTime] = useBestRecord('reaction-best-ms', 0)

  const clearTimers = () => {
    if (countdownTimer.current) {
      window.clearTimeout(countdownTimer.current)
      countdownTimer.current = null
    }
  }

  const start = () => {
    clearTimers()
    playSound('click')
    setResult('')
    setCurrentMs(0)
    setRank('')
    setLights([true, false, false, false, false])
    setPhase('countdown')

    // Secuencia de luces tipo semáforo de Fórmula 1
    let step = 1
    const lightInterval = window.setInterval(() => {
      playSound('move')
      step += 1
      setLights((prev) => prev.map((_, idx) => idx < step))
      if (step >= 5) {
        window.clearInterval(lightInterval)
        // Luces rojas encendidas. Tiempo aleatorio entre 1.0s y 2.6s para apagado / verde
        const randomWait = Math.floor(Math.random() * 1600) + 1000
        countdownTimer.current = window.setTimeout(() => {
          startedAt.current = performance.now()
          setLights([false, false, false, false, false])
          setPhase('ready')
          playSound('ready')
        }, randomWait)
      }
    }, 450)
  }

  const clickTarget = () => {
    if (phase === 'countdown' || phase === 'waiting') {
      clearTimers()
      playSound('lose')
      setResult('🚨 Salida en falso (Jump Start). ¡Espera a que el semáforo se apague y active el verde!')
      setRank('Penalizado')
      setPhase('result')
    } else if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startedAt.current)
      setCurrentMs(elapsed)
      let tier = '🏎️ Nivel Leyenda de F1'
      if (elapsed > 400) tier = '🚗 Conductor Urbano'
      else if (elapsed > 300) tier = '⚡ Piloto Semi-Pro'
      else if (elapsed > 230) tier = '🏆 Piloto Profesional'
      else tier = '⚡ Reflejos Supersónicos'

      setRank(tier)
      playSound(elapsed <= 250 ? 'win' : 'success')
      setResult(`¡Meta! Tiempo de reacción: ${elapsed} ms. ${elapsed < bestTime || bestTime === 0 ? '¡Nuevo récord!' : ''}`)
      saveBestTime(elapsed)
      setPhase('result')
    }
  }

  return (
    <div className="mini-game">
      <div className="game-hud">
        <div><span>TIEMPO ACTUAL</span><strong>{currentMs ? `${currentMs} ms` : '—'}</strong></div>
        <div><span>RATING</span><strong className="compact-stat">{rank || 'Esperando largada'}</strong></div>
        <div><span>RÉCORD PERSONAL</span><strong>{bestTime ? `${bestTime} ms` : '—'}</strong></div>
        <div><span>OBJETIVO</span><strong>&lt; 250 ms</strong></div>
      </div>
      
      {/* Luces del semáforo estilo Grand Prix */}
      <div className="f1-gantry" aria-label="Semáforo de salida">
        {lights.map((isOn, idx) => (
          <div key={idx} className={`f1-bulb ${isOn ? 'on' : ''} ${phase === 'ready' ? 'green' : ''}`}>
            <span />
          </div>
        ))}
      </div>

      <p className="game-status" aria-live="polite">
        {phase === 'countdown'
          ? 'Preparando largada… observa las luces rojas…'
          : phase === 'ready'
          ? '🟢 ¡ACELERA AHORA! ¡PULSA!'
          : result || 'Pulsa iniciar y reacciona al apagado de las luces.'}
      </p>

      {phase === 'idle'
        ? <button className="button button-primary start-f1-btn" onClick={start}>🏁 Iniciar prueba de reflejos</button>
        : (
          <button
            className={`reaction-target ${phase === 'ready' ? 'ready' : ''} ${phase === 'countdown' ? 'wait-target' : ''}`}
            onClick={clickTarget}
          >
            {phase === 'ready' ? '¡¡ACELERA!!' : 'Mantén la calma…'}
          </button>
        )}
      {phase === 'countdown' && (
        <button className="text-button" onClick={() => { clearTimers(); setPhase('idle'); setResult('Prueba cancelada.') }}>
          Cancelar
        </button>
      )}
      {phase === 'result' && (
        <button className="button button-secondary" onClick={start}>↻ Intentar de nuevo</button>
      )}
    </div>
  )
}

// ==========================================
// 5. BATALLA DE ARRECIFE (DEEP BLUE)
// ==========================================
export function RockPaperScissors() {
  const options = ['Piedra', 'Papel', 'Tijera']
  const icons = { Piedra: '🪨 Piedra marina', Papel: '📜 Manto de algas', Tijera: '✂️ Pinza de cangrejo' }
  const [result, setResult] = useState('Elige tu criatura o elemento submarino para empezar.')
  const [playerChoice, setPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [bestWins, saveBestWins] = useBestRecord('rock-paper-scissors-best-wins', 0, 'higher')

  useEffect(() => {
    saveBestWins(score.wins)
  }, [score.wins, saveBestWins])

  const play = (choice) => {
    if (isAnimating) return
    playSound('flip')
    setIsAnimating(true)
    setPlayerChoice(choice)
    setOpponentChoice(null)
    setResult('La corriente marina está decidiendo…')

    window.setTimeout(() => {
      const opponent = options[randomIndex(options.length)]
      setOpponentChoice(opponent)
      setIsAnimating(false)

      if (choice === opponent) {
        playSound('wrong')
        setResult(`Empate en las profundidades: ambos invocaron ${choice}.`)
        setScore((current) => ({ ...current, draws: current.draws + 1 }))
      } else if (
        (choice === 'Piedra' && opponent === 'Tijera') ||
        (choice === 'Papel' && opponent === 'Piedra') ||
        (choice === 'Tijera' && opponent === 'Papel')
      ) {
        playSound('win')
        setResult(`🌊 ¡Victoria oceánica! ${choice} vence a ${opponent}.`)
        setScore((current) => ({ ...current, wins: current.wins + 1 }))
      } else {
        playSound('lose')
        setResult(`La marea enemiga prevalece: ${opponent} vence a ${choice}.`)
        setScore((current) => ({ ...current, losses: current.losses + 1 }))
      }
    }, 450)
  }

  return (
    <div className="mini-game">
      <div className="game-hud rps-hud">
        <div><span>VICTORIAS</span><strong>{score.wins}</strong></div>
        <div><span>EMPATES</span><strong>{score.draws}</strong></div>
        <div><span>DERROTAS</span><strong>{score.losses}</strong></div>
        <div><span>RÉCORD</span><strong>{bestWins}</strong></div>
      </div>

      <div className="battle-arena">
        <div className={`fighter-card ${playerChoice ? 'active' : ''}`}>
          <span className="fighter-label">TU JUGADA</span>
          <strong className="fighter-symbol">{playerChoice ? icons[playerChoice].split(' ')[0] : '🌊'}</strong>
          <small>{playerChoice || 'Selecciona'}</small>
        </div>
        <div className="vs-badge">VS</div>
        <div className={`fighter-card opponent ${opponentChoice ? 'active' : ''}`}>
          <span className="fighter-label">MAREA RIVAL</span>
          <strong className="fighter-symbol">{isAnimating ? '🌀' : opponentChoice ? icons[opponentChoice].split(' ')[0] : '🐙'}</strong>
          <small>{isAnimating ? 'Eligiendo…' : opponentChoice || 'Misterio'}</small>
        </div>
      </div>

      <p className="game-status" aria-live="polite">{result}</p>
      
      <div className="rps-options">
        {options.map((option) => (
          <button
            key={option}
            disabled={isAnimating}
            className="rps-option"
            onClick={() => play(option)}
          >
            <span>{icons[option].split(' ')[0]}</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 6. RETO DE COLORES & STROOP (PIXEL PALS)
// ==========================================
export function ColorMatch() {
  const colors = [
    { name: 'Violeta', value: '#a58bff' },
    { name: 'Coral', value: '#ff7d91' },
    { name: 'Turquesa', value: '#54d4c6' },
    { name: 'Amarillo', value: '#f4c767' },
    { name: 'Verde Neón', value: '#4ade80' },
  ]
  const [target, setTarget] = useState(0)
  const [textColor, setTextColor] = useState(0) // Efecto Stroop psicológico
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [message, setMessage] = useState('Pulsa el botón del color que dice el TEXTO (¡cuidado con la tinta de distracción!).')
  const [wrongIndex, setWrongIndex] = useState(-1)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [started, setStarted] = useState(false)
  const finished = started && secondsLeft === 0
  const [bestScore, saveBestScore] = useBestRecord('color-match-best-score', 0, 'higher')

  useEffect(() => {
    if (!started || finished) return undefined
    const interval = window.setInterval(() => setSecondsLeft((remaining) => Math.max(0, remaining - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [started, finished])

  useEffect(() => {
    if (finished) {
      playSound('win')
      saveBestScore(score)
    }
  }, [finished, score, saveBestScore])

  const nextRound = useCallback(() => {
    const nextTarget = randomIndex(colors.length)
    // Tinta de texto engañosa (efecto Stroop)
    const nextTextInk = randomIndex(colors.length)
    setTarget(nextTarget)
    setTextColor(nextTextInk)
  }, [colors.length])

  const chooseColor = (index) => {
    if (finished) return
    if (!started) setStarted(true)

    if (index !== target) {
      playSound('wrong')
      setMessage('¡Ups, color incorrecto! Racha reiniciada.')
      setWrongIndex(index)
      setStreak(0)
      setMultiplier(1)
      return
    }

    playSound('match')
    const nextStreak = streak + 1
    const newMultiplier = nextStreak >= 10 ? 3 : nextStreak >= 5 ? 2 : 1
    setStreak(nextStreak)
    setMultiplier(newMultiplier)
    setScore((current) => current + (1 * newMultiplier))
    setMessage(nextStreak >= 5 ? `🔥 ¡Racha de x${newMultiplier}! Combo perfecto.` : '¡Correcto! Siguiente color.')
    setWrongIndex(-1)
    nextRound()
  }

  const reset = () => {
    playSound('click')
    setTarget(randomIndex(colors.length))
    setTextColor(randomIndex(colors.length))
    setScore(0)
    setStreak(0)
    setMultiplier(1)
    setMessage('Encuentra y pulsa el color que dice la palabra.')
    setWrongIndex(-1)
    setSecondsLeft(30)
    setStarted(false)
  }

  return (
    <div className="mini-game">
      <div className="game-hud">
        <div><span>TIEMPO</span><strong>{secondsLeft}<small> s</small></strong></div>
        <div><span>PUNTOS</span><strong>{score}</strong></div>
        <div><span>MULTIPLICADOR</span><strong>{multiplier > 1 ? `x${multiplier} ⭐` : 'x1'}</strong></div>
        <div><span>RÉCORD</span><strong>{bestScore}</strong></div>
      </div>
      <p className="game-status" aria-live="polite">
        {finished ? '🏁 ¡Tiempo cumplido! Gran puntuación.' : message}
      </p>
      
      <div className="color-target-box">
        <span className="target-instruction">Presiona el botón de color:</span>
        <strong
          className="color-stroop-text"
          style={{ color: colors[textColor].value }}
        >
          {colors[target].name}
        </strong>
        <small className="stroop-tip">⚠️ La palabra manda, no el color de la tinta</small>
      </div>

      <div className="color-options">
        {colors.map((color, index) => (
          <button
            key={color.name}
            disabled={finished}
            className={`color-option ${wrongIndex === index ? 'wrong' : ''}`}
            style={{ '--swatch': color.value }}
            onClick={() => chooseColor(index)}
            aria-label={`Elegir ${color.name}`}
          >
            <span className="color-tooltip">{color.name}</span>
          </button>
        ))}
      </div>

      {finished && <button className="button button-secondary" onClick={reset}>↻ Jugar otra vez</button>}
    </div>
  )
}
