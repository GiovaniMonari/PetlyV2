# PetlyV2 — Next.js

Plataforma de pet-sitter migrada de Vite para Next.js 15 (App Router).

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Framer Motion**
- **Lucide React**

## Primeiros passos

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
├── app/
│   ├── layout.tsx      # Root layout com metadata
│   ├── page.tsx        # Página principal
│   └── globals.css     # Estilos globais + Tailwind
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── FilterBar.tsx
│   ├── CaregiverCard.tsx
│   ├── BecomeCaregiverModal.tsx
│   ├── HowItWorks.tsx
│   └── Footer.tsx
├── data/
│   └── caregivers.ts
└── utils/
    └── cn.ts
```

## Mudanças em relação ao Vite

| Antes (Vite)              | Depois (Next.js)                          |
|---------------------------|-------------------------------------------|
| `vite.config.ts`          | `next.config.ts`                          |
| `index.html`              | `src/app/layout.tsx`                      |
| `src/App.tsx`             | `src/app/page.tsx` (com `'use client'`)   |
| `src/index.css`           | `src/app/globals.css`                     |
| `@tailwindcss/vite`       | `@tailwindcss/postcss` + `postcss.config.mjs` |
| `<img>`                   | `<Image>` do `next/image`                 |
| Sem diretivas de client   | `'use client'` em componentes interativos |
| `vite-plugin-singlefile`  | Removido (Next.js gera múltiplos chunks)  |
