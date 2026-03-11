# Effegi Lab

Ecommerce wedding stationery artigianale per Effegi Lab (Napoli): partecipazioni, kit cerimonia, tableaux e coordinati personalizzabili.

## Stack tecnologico

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (catalogo, ordini, page builder)
- Stripe (checkout e webhook)
- Zustand (carrello)
- React Query
- Cloudinary (media)
- Resend (email)
- dnd-kit (riordino drag & drop)

## Setup locale

1. Clona il repository:
```bash
git clone https://github.com/<USERNAME>/effegilab.git
cd effegilab
```

2. Installa dipendenze:
```bash
npm install
```

3. Crea e compila `.env.local`:
```bash
cp .env.example .env.local
```

4. Avvia ambiente di sviluppo:
```bash
npm run dev
```

App disponibile su `http://localhost:3000`.

## Struttura cartelle (principale)

```text
src/
  app/
    (shop)/                  # frontend pubblico
    (admin)/admin/           # pannello admin
    api/                     # checkout, webhook, upload Cloudinary
  components/
    shop/                    # navbar, footer, product card, carrello
    admin/                   # dashboard, ordini, prodotti, categorie, coupon
    page-builder/            # BlockRenderer + BlockEditor
    ui/                      # componenti base
  lib/
    supabase/                # client/server auth + middleware helpers
    stripe/                  # client/server stripe init
    cart-store.ts            # Zustand cart state
    utils.ts                 # helper comuni
  types/
    index.ts                 # tipi dominio ecommerce

scripts/
  seed-products.ts           # seed categorie/prodotti demo reali
```

## Comandi utili

```bash
npm run dev
npm run lint
npm run build
npm run seed
```

## Aggiungere prodotti (Admin Panel)

1. Accedi a `/admin/login`.
2. Vai in `Prodotti`.
3. Clicca `+ Nuovo Prodotto`.
4. Compila dati base (nome, slug, prezzo, categoria, collezione).
5. Carica immagini (Cloudinary).
6. Salva bozza o pubblica.

## Deploy su Vercel

1. Importa repository su Vercel.
2. Imposta tutte le variabili ambiente Production (vedi `VERCEL_ENV_CHECKLIST.md`).
3. Deploy.
4. Configura webhook Stripe:
   - endpoint: `https://effegi-lab.it/api/webhook/stripe`
   - aggiorna `STRIPE_WEBHOOK_SECRET`
   - redeploy.

## Variabili ambiente richieste

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

## Contatti progetto

- Brand: Effegi Lab
- Email: info@effegi-lab.it
- Sito: https://effegi-lab.it
- Booking: https://effegi-lab2.reservio.com/booking
- WhatsApp post-ordine: canale assistenza Effegi Lab
