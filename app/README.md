# Legal Calendar - Frontend

Frontend del sistema de gestion de citas legales. Construido con React 19, Vite, TanStack Query, Zustand y date-fns.

## Requisitos

- Node.js 20+
- npm 10+
- Backend corriendo en `http://localhost:3000`

## Instalacion

```bash
npm install
```

## Variables de entorno

Crear archivo `.env` en la raiz del proyecto:

```
VITE_API_URL=http://localhost:3000/api/v1
```

| Variable | Requerida | Descripcion | Ejemplo |
|----------|-----------|-------------|---------|
| `VITE_API_URL` | Si | URL base de la API REST (backend) | `https://api.legalcalendar.com/api/v1` |

En Vercel, configurar la variable desde **Settings > Environment Variables**. No incluir barra final (`/`).

> Las variables con prefijo `VITE_` se exponen al cliente (bundle del navegador). No colocar secretos en variables `VITE_`.

## Deploy en Vercel

El proyecto incluye `vercel.json` con la configuracion necesaria para SPA routing (todas las rutas redirigen a `index.html`).

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Vercel detecta Vite automaticamente. Verificar:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Configurar `VITE_API_URL` en **Settings > Environment Variables**
4. Deploy

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Build

```bash
npm run build
```

Los archivos se generan en `dist/`.

## Tests

```bash
npm test          # modo watch
npm run test:run  # una ejecucion
```

## Estructura del Proyecto

```
src/
├── features/           # Features por dominio
│   ├── auth/           # Autenticacion (login, registro, OTP, recovery)
│   ├── appointments/   # Gestion de citas (calendario, CRUD)
│   ├── profile/        # Perfil del abogado
│   └── admin/          # Panel de administracion
├── shared/             # Codigo compartido
│   ├── components/     # Primitivas UI (Button, Input, Modal, etc.)
│   ├── hooks/          # Hooks compartidos
│   ├── utils/          # Utilidades (API client, dates, timezone, errors)
│   ├── types/          # TypeScript types
│   └── layouts/        # Layouts (Auth, Dashboard)
├── stores/             # Zustand stores (auth, UI)
├── router/             # React Router + guards
└── App.tsx             # Root: providers + router
```

## Stack

| Libreria | Proposito |
|----------|-----------|
| React 19 + React Compiler | UI |
| Vite 8 | Bundler y dev server |
| TanStack Query 5 | Server state (cache, fetching) |
| Zustand 5 | Client state (auth, UI) |
| Axios | Cliente HTTP |
| date-fns 4 + @date-fns/tz | Fechas y zonas horarias |
| React Router 7 | Routing |
| @dnd-kit/core | Drag and drop en calendario |
| Vitest | Testing |

## Documentacion

- [Arquitectura](docs/ARCHITECTURE.md) — Feature-Based Architecture, React Query + Zustand, calendario custom, drag & drop, React Compiler
