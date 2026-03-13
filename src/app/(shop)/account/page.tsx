import { redirect } from "next/navigation";

import { AccountClient } from "@/app/(shop)/account/AccountClient";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  const firstName = String(metadata.first_name ?? metadata.name ?? "").trim();
  const lastName = String(metadata.last_name ?? metadata.surname ?? "").trim();

  return (
    <AccountClient
      user={{
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        phone: String(metadata.phone ?? ""),
        shippingAddress: String(metadata.shipping_address ?? ""),
      }}
    />
  );
}
