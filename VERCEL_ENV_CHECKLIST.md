# Variabili da inserire su Vercel Dashboard

## Production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=         ← da Stripe Dashboard dopo deploy
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=https://effegi-lab.it

## Come configurare
1. Vai su vercel.com → progetto → Settings → Environment Variables
2. Aggiungi ogni variabile per Environment: Production
3. Dopo deploy: vai su Stripe → Developers → Webhooks
   → Add endpoint: https://effegi-lab.it/api/webhook/stripe
   → Copia signing secret → aggiorna STRIPE_WEBHOOK_SECRET su Vercel
   → Redeploy
