export default function Home() {
  const checklist = [
    "Setup Next.js + TypeScript + Tailwind completato",
    "Librerie ecommerce installate (Supabase, Stripe, Zustand, dnd-kit)",
    "Config base Supabase pronta (client/server/middleware)",
    "Template variabili ambiente creato (.env.example)",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Effegi Lab
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Fase 1 avviata</h1>
        <p className="text-slate-600">
          Base tecnica pronta. Prossimo blocco: collegamento servizi esterni
          (Supabase, Stripe, Cloudinary, Resend) e creazione schema database.
        </p>
        <ul className="space-y-3">
          {checklist.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
            >
              {item}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
