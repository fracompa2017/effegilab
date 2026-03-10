import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Login Admin</h1>
      <p className="mt-2 text-slate-600">Accedi al pannello di gestione.</p>
      <form className="mt-6 space-y-4">
        <Input id="email" type="email" label="Email" placeholder="admin@effegilab.it" />
        <Input id="password" type="password" label="Password" placeholder="••••••••" />
        <Button type="submit" className="w-full">
          Entra
        </Button>
      </form>
    </section>
  );
}
