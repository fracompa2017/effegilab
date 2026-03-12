import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Scegli il Modello",
    description: "Sfoglia il catalogo e trova il design che ti rappresenta",
  },
  {
    number: "2",
    title: "Personalizza Online",
    description: "Inviaci i tuoi testi, font e colori preferiti",
  },
  {
    number: "3",
    title: "Approva la Bozza",
    description: "Ricevi la grafica in 48h e richiedici tutte le modifiche",
  },
  {
    number: "4",
    title: "Ricevi a Casa",
    description: "Stampiamo e spediamo in 5-7 giorni",
  },
];

export function HowItWorks() {
  return (
    <section className="space-y-5 rounded-2xl border border-[#E8DED2] bg-white p-4 md:p-6">
      <header className="space-y-1">
        <h2 className="font-serif text-[34px] italic leading-none text-[#1E1810]">Come Funziona</h2>
        <p className="text-sm text-[#6F645A]">Un processo semplice, in 4 step chiari e veloci.</p>
      </header>

      <div className="relative space-y-5 pl-7 md:grid md:grid-cols-4 md:gap-4 md:space-y-0 md:pl-0">
        <div className="absolute bottom-6 left-[22px] top-6 w-px bg-[#E8DCD0] md:hidden" />
        {steps.map((step) => (
          <article key={step.number} className="relative space-y-2">
            <span className="absolute -left-7 top-0 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#D4918F] text-base font-semibold text-white md:static md:mb-2">
              {step.number}
            </span>
            <h3 className="font-serif text-[18px] text-[#1E1810]">{step.title}</h3>
            <p className="text-[13px] leading-relaxed text-[#6E635A]">{step.description}</p>
          </article>
        ))}
      </div>

      <Link
        href="/shop"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4918F] px-4 text-sm font-medium text-white"
      >
        Inizia Ora → Scegli il Modello
      </Link>
    </section>
  );
}
