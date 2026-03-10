import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminOrdersPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <Sidebar />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Gestione Ordini</h1>
        <p className="mt-2 text-slate-600">Pagina in costruzione.</p>
      </section>
    </div>
  );
}
