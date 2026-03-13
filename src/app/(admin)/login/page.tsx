import { AdminLoginClient } from "@/components/admin/AdminLoginClient";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  return <AdminLoginClient errorParam={params.error ?? null} />;
}
