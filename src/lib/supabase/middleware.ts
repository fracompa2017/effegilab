import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/shared";

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

function redirectWithCookies(request: NextRequest, response: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));
  copyCookies(response, redirectResponse);
  return redirectResponse;
}

function getJwtRole(user: { app_metadata?: unknown; user_metadata?: unknown }) {
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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute) {
    return NextResponse.next({ request });
  }

  if (isAdminLoginRoute) {
    return NextResponse.next({ request });
  }

  try {
    let response = NextResponse.next({ request });
    const { url, anonKey } = getSupabaseConfig();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return redirectWithCookies(request, response, "/admin/login");
    }

    // Primary authz path: read role directly from JWT metadata.
    // This avoids fragile profile lookups in middleware and prevents admin lockouts.
    const jwtRole = getJwtRole(user);
    if (jwtRole === "admin") {
      return response;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return redirectWithCookies(request, response, "/admin/login?error=db");
    }

    if (profile?.role !== "admin") {
      return redirectWithCookies(request, response, "/admin/login?error=unauthorized");
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=unexpected", request.url));
  }
}
