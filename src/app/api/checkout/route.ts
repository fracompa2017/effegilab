import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "Endpoint checkout Stripe in costruzione.",
    },
    { status: 501 },
  );
}
