type DashboardStatsProps = {
  ordiniOggi?: number;
  fatturato?: number;
  prodottiAttivi?: number;
  ordiniInSospeso?: number;
};

export function DashboardStats({
  ordiniOggi = 0,
  fatturato = 0,
  prodottiAttivi = 0,
  ordiniInSospeso = 0,
}: DashboardStatsProps) {
  const stats = [
    { label: "Ordini Oggi", value: ordiniOggi.toString() },
    { label: "Fatturato", value: `€ ${fatturato.toFixed(2)}` },
    { label: "Prodotti Attivi", value: prodottiAttivi.toString() },
    { label: "Ordini in Sospeso", value: ordiniInSospeso.toString() },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
