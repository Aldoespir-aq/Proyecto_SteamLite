# SteamLite

Plataforma SPA de catálogo de videojuegos y minijuegos, desarrollada con Vite y React.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Iniciar en local

```bash
npm install
npm run dev
```

## Comprobaciones

```bash
npm run lint
npm run build
npm run test
```

## Funcionalidades

- Catálogo cargado desde `public/games.json` con `useEffect`, estados de carga/error y reintento.
- Búsqueda en tiempo real, filtros por género y carrusel destacado.
- Fichas de juego con galería de imágenes ilustrativas, reseñas de demostración, valoración y acciones de compra.
- Carrito y checkout de demostración con validación Formik + Yup.
- Biblioteca persistente en `localStorage`.
- El juego gratuito se puede obtener y jugar directamente; los demás se desbloquean al completar la compra simulada.
- Un minijuego interactivo asociado a cada juego: memoria, tres en raya contra la máquina, número secreto con pistas, prueba de reflejos, piedra-papel-tijera y reto de colores cronometrado.
- Marcadores, instrucciones dentro de cada juego y récords personales persistidos en `localStorage`.
- Pruebas de integración para catálogo/filtros, acceso a minijuegos y checkout (`npm run test`).

Las portadas principales son recursos SVG locales. Las imágenes de la galería son ilustrativas y se cargan desde Unsplash; no son capturas reales de los minijuegos. Las reseñas son contenido de muestra. El checkout es solo una simulación y no procesa pagos reales. Para probarlo, usa un número de 16 dígitos como `4242424242424242`, una fecha vigente en formato mes/año como `12/29` y un CVC de 3 o 4 dígitos.
