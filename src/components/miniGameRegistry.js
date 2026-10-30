import { ColorMatch, MemoryGame, NumberGuess, ReactionGame, RockPaperScissors, TicTacToe } from './MiniGames'

export const miniGames = {
  memory: { title: 'JUEGO DE MEMORIA', objective: 'Encuentra las seis parejas con el menor número de movimientos.', controls: 'Selecciona dos cartas para revelar sus símbolos.', Component: MemoryGame },
  'tic-tac-toe': { title: 'TRES EN RAYA', objective: 'Alinea tres X antes de que la máquina consiga tres O.', controls: 'Elige una casilla vacía. La máquina responderá automáticamente.', Component: TicTacToe },
  'number-guess': { title: 'NÚMERO SECRETO', objective: 'Adivina el número oculto entre 1 y 50.', controls: 'Escribe un número y usa las pistas para encontrarlo.', Component: NumberGuess },
  reaction: { title: 'RETO DE REFLEJOS', objective: 'Pulsa la señal verde tan rápido como puedas.', controls: 'Inicia la prueba y espera. No pulses antes de que cambie a verde.', Component: ReactionGame },
  'rock-paper-scissors': { title: 'PIEDRA, PAPEL O TIJERA', objective: 'Gana tantas rondas como puedas contra la máquina.', controls: 'Elige piedra, papel o tijera en cada ronda.', Component: RockPaperScissors },
  'color-match': { title: 'RETO DE COLORES', objective: 'Consigue tantos aciertos como puedas en 30 segundos.', controls: 'Lee el nombre del color y pulsa la muestra correcta.', Component: ColorMatch },
}
