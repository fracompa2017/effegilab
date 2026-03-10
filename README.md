# Effegi Lab Ecommerce

Base iniziale del progetto ecommerce moderno costruito con:

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase
- Stripe
- Vercel

## Requisiti

- Node.js `>=20`
- npm `>=10`

## Installazione

1. Installa le dipendenze:

```bash
npm install
```

2. Crea il file `.env.local` partendo da `.env.example` e compila le chiavi.

## Sviluppo locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Comandi utili

```bash
npm run lint
npm run build
```

## Setup completato finora

- Bootstrap progetto Next.js
- Librerie ecommerce principali installate
- Config base Supabase (`src/lib/supabase/*`)
- Middleware sessione Supabase (`middleware.ts`)
- Template variabili ambiente (`.env.example`)

## Prossimi passi

1. Configurare `.env.local` con chiavi reali.
2. Creare progetto Supabase e lanciare lo script SQL tabelle.
3. Collegare repository a GitHub e deploy automatico su Vercel.
4. Avviare sviluppo frontend catalogo + carrello.

## Riferimenti

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://docs.stripe.com/)
