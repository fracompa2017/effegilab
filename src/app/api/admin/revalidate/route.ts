import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/shared";

type AuthUser = {
  id: string;
  app_metadata?: unknown;
  user_metadata?: unknown;
};

function getJwtRole(user: AuthUser) {
  const appRole =
    user.app_metadata && typeof user.app_metadata === "object"
      ? (user.app_metadata as Record<string, unknown>).role
      : undefined;
  const userRole =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>).role
      : undefined;

  if (typeof appRole === "string") {
    return appRole;
  }
  if (typeof userRole === "string") {
    return userRole;
  }
  return null;
}

async function isAdminRequest() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  if (getJwtRole(user as AuthUser) === "admin") {
    return true;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAdminRequest();
    if (!authorized) {
      return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as { path?: string };
    const path = typeof payload.path === "string" && payload.path.startsWith("/") ? payload.path : "/";

    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        revalidated: false,
        error: error instanceof Error ? error.message : "Revalidate failed",
      },
      { status: 500 },
    );
  }
}
