import { createHash } from "crypto";
import { NextResponse } from "next/server";

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

    const payload = (await cloudinaryResponse.json()) as { secure_url?: string };
    return NextResponse.json({ secureUrl: payload.secure_url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Errore upload Cloudinary.",
      },
      { status: 500 },
    );
  }
}

