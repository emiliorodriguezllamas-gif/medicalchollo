import { NextRequest, NextResponse } from "next/server";
import { voteReviewHelpful } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const count = voteReviewHelpful(id);
    return NextResponse.json({ success: true, helpful_count: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
