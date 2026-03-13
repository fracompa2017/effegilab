import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/shared";

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  original_filename?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

async function getCurrentUserId() {
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

  return user?.id ?? null;
}

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Configurazione Cloudinary mancante." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File non valido." }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "effegilab/products";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash("sha1")
      .update(`${paramsToSign}${apiSecret}`)
      .digest("hex");

    const uploadPayload = new FormData();
    uploadPayload.append("file", file);
    uploadPayload.append("api_key", apiKey);
    uploadPayload.append("timestamp", String(timestamp));
    uploadPayload.append("signature", signature);
    uploadPayload.append("folder", folder);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadPayload,
      },
    );

    if (!cloudinaryResponse.ok) {
      const errorPayload = await cloudinaryResponse.text();
      return NextResponse.json(
        { error: `Upload Cloudinary fallito: ${errorPayload}` },
        { status: 500 },
      );
    }

    const payload = (await cloudinaryResponse.json()) as CloudinaryUploadResponse;

    const secureUrl = payload.secure_url;
    if (!secureUrl) {
      return NextResponse.json(
        { error: "URL immagine non disponibile dopo l'upload." },
        { status: 500 },
      );
    }

    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const uploadedBy = await getCurrentUserId();

      const { error: insertError } = await serviceClient.from("media").insert({
        url: secureUrl,
        public_id: payload.public_id ?? null,
        filename: payload.original_filename ? `${payload.original_filename}.${payload.format ?? ""}` : file.name,
        width: payload.width ?? null,
        height: payload.height ?? null,
        size: payload.bytes ?? null,
        format: payload.format ?? null,
        uploaded_by: uploadedBy,
      });

      if (insertError) {
        console.error("Errore salvataggio metadata media:", insertError.message);
      }
    }

    return NextResponse.json({ secureUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore upload Cloudinary.",
      },
      { status: 500 },
    );
  }
}
