# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment Setup

Use a single `.env` file copied from `.env.example`.

1. Copy template:
   cp .env.example .env
2. Local defaults (already in example):
   DEV_PROFILE=local
3. Remote dev (HMR over wss) set:
   DEV_PROFILE=server
   HMR_PROTOCOL=wss
   HMR_HOST=your-domain
   HMR_CLIENT_PORT=443
   ALLOWED_HOSTS=.your-domain
4. Optional flags:
   - VITE_APEX_OPTIMIZE=true (force optimize apex charts)
   - VITE_POLL=1 (fallback for FS events)

Production build ignores most of these; run:
npm run build
and serve `dist/` via nginx.

Only variables prefixed with VITE\_ are exposed to the browser.
