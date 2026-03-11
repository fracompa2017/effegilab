"use client";

type ShopErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ShopError({ error, reset }: ShopErrorProps) {
  return (
    <div className="rounded-2xl border border-[#E8B4B4] bg-white p-8">
      <h2 className="font-serif text-3xl text-[#1E1810]">Ops, qualcosa non ha funzionato</h2>
      <p className="mt-2 text-sm text-[#5C5048]">
        {error.message || "Errore imprevisto durante il caricamento della pagina."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full bg-[#D4918F] px-5 py-2 text-sm font-medium text-white hover:bg-[#c47f7d]"
      >
        Riprova
      </button>
    </div>
  );
}

