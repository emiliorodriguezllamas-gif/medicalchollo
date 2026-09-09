import { NextRequest, NextResponse } from "next/server";
import { queryPriceHistory } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("dias") ?? 30);

    const history = queryPriceHistory(id, days);

    return NextResponse.json({ history });
  } catch (err) {
    console.error("Error history API:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
