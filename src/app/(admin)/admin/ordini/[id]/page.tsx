import { notFound } from "next/navigation";

import { OrderDetailClient } from "@/components/admin/OrderDetailClient";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();

  if (error) {
    return null;
  }

  return (data as Order | null) ?? null;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}

