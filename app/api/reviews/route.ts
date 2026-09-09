import { NextRequest, NextResponse } from "next/server";
import { queryProductReviews, insertProductReview } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }

  try {
    const data = queryProductReviews(productId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, rating, title, comment, clinicName, specialty, userName } = body;

    if (!productId || !rating || !title?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (producto, valoracion, titulo o comentario)" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La valoracion debe ser entre 1 y 5 estrellas" },
        { status: 400 }
      );
    }

    let user = null;
    try {
      user = await getCurrentUser();
    } catch {}

    const finalUserName = user?.name || userName?.trim() || "Profesional Sanitario";
    const finalClinicName = user?.clinicName || clinicName?.trim() || null;
    const finalSpecialty = specialty?.trim() || "Odontología General";

    const review = insertProductReview({
      product_id: productId,
      user_id: user?.id || ("clinician-" + Date.now()),
      user_name: finalUserName,
      clinic_name: finalClinicName,
      specialty: finalSpecialty,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      is_verified_buyer: true,
    });

    const updatedSummary = queryProductReviews(productId);

    return NextResponse.json({
      success: true,
      review,
      summary: updatedSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
