"use client";

import { useState } from "react";
import { Star, ThumbsUp, ShieldCheck, CheckCircle2, MessageSquarePlus, Building2, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  clinic_name: string | null;
  specialty: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_buyer: number;
  helpful_count: number;
  created_at: string;
}

export interface ReviewSummary {
  reviews: ReviewItem[];
  totalCount: number;
  averageRating: number;
  distribution: Record<number, number>;
  recommendPercent: number;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  initialData?: ReviewSummary;
  currentUser?: {
    id?: string;
    name?: string;
    clinicName?: string;
    isSubscribed?: boolean;
  } | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Muy deficiente",
  2: "Regular / mejorable",
  3: "Aceptable / estándar",
  4: "Muy buena calidad",
  5: "Excelente calidad clínica",
};

export function ProductReviews({
  productId,
  productName,
  initialData,
  currentUser,
}: ProductReviewsProps) {
  const [data, setData] = useState<ReviewSummary>(
    initialData || {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recommendPercent: 100,
    }
  );

  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState(currentUser?.name || "");
  const [clinicName, setClinicName] = useState(currentUser?.clinicName || "");
  const [specialty, setSpecialty] = useState("Odontología General");

  // Voted reviews tracking in local state
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  const filteredReviews = filterRating
    ? data.reviews.filter((r) => r.rating === filterRating)
    : data.reviews;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !comment.trim() || !userName.trim()) {
      setErrorMessage("Por favor, completa tu nombre, el título y el comentario.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          userName: userName.trim(),
          clinicName: clinicName.trim() || null,
          specialty,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Error al publicar la reseña");
      }

      // Actualizar datos locales
      setData(resData.summary);
      setSuccessMessage(true);
      setShowForm(false);
      setTitle("");
      setComment("");
      setTimeout(() => setSuccessMessage(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo guardar la reseña. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHelpful(reviewId: string) {
    if (votedReviews[reviewId]) return;

    // Optimistic update
    setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ),
    }));

    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
    } catch {
      // Ignorar fallos de red en voto
    }
  }

  return (
    <div id="resenas" className="space-y-6 pt-4">
      {/* Mensaje de éxito flotante */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-800 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">¡Reseña clínica publicada con éxito!</p>
            <p className="text-xs text-emerald-700">Tu valoración ayuda a otras clínicas a comparar y comprar con garantía clínica.</p>
          </div>
        </div>
      )}

      {/* Tarjeta de Resumen y Valoraciones */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-b border-gray-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Opiniones de Clínicas y Profesionales</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Verificadas
                </span>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Valoraciones reales de odontólogos y profesionales sanitarios colegiados.
              </p>
            </div>

            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm shadow-sm"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {showForm ? "Cerrar formulario" : "Escribir reseña profesional"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Puntuación Media */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-center">
              <span className="text-5xl font-black text-gray-900 tracking-tight">
                {data.averageRating > 0 ? data.averageRating.toFixed(1) : "—"}
              </span>

              {/* Estrellas grandes */}
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(data.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs font-medium text-gray-500">
                Basado en <strong className="text-gray-900">{data.totalCount}</strong> {data.totalCount === 1 ? "opinión" : "opiniones"} de clínicas
              </p>

              {data.totalCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {data.recommendPercent}% recomiendan este producto
                </div>
              )}
            </div>

            {/* Barras de desglose por estrella */}
            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.distribution[star] || 0;
                const percentage = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;
                const isSelected = filterRating === star;

                return (
                  <button
                    key={star}
                    onClick={() => setFilterRating(isSelected ? null : star)}
                    className={`w-full flex items-center gap-3 text-xs group transition-colors p-1 rounded-lg ${
                      isSelected ? "bg-blue-50 text-blue-900 font-semibold" : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="w-12 text-left font-medium flex items-center gap-1 shrink-0">
                      {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                    </span>

                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected ? "bg-blue-600" : "bg-amber-400 group-hover:bg-amber-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-14 text-right text-gray-400 shrink-0">
                      {count} ({percentage}%)
                    </span>
                  </button>
                );
              })}

              {filterRating && (
                <div className="pt-2 text-right">
                  <button
                    onClick={() => setFilterRating(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Mostrar todas las valoraciones
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de Reseña (Desplegable) */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/30 shadow-md animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="border-b border-blue-100 pb-3">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Nueva valoración clínica de: <span className="text-blue-700">{productName}</span>
            </CardTitle>
            <p className="text-xs text-gray-500">
              Solo profesionales y clínicas verificadas pueden opinar. Esto evita manipulaciones de distribuidores y bots.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  {errorMessage}
                </div>
              )}

              {/* Selector interactivo de estrellas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tu puntuación clínica general *
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-gray-300 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= (hoverRating ?? rating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <span className="text-sm font-semibold text-blue-900 bg-blue-100/80 px-3 py-1 rounded-full">
                    {RATING_LABELS[hoverRating ?? rating]}
                  </span>
                </div>
              </div>

              {/* Título de la reseña */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Título de tu reseña *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Excelente tacto y no se rompe con el rotatorio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Comentario */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Opinión y experiencia clínica detallada *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detalla qué tal se comporta el material en clínica, relación calidad/precio comparada con otras marcas, ergonomía, durabilidad o recomendaciones..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Datos del profesional */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tu Nombre o Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Dra. Carmen Soto"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre de tu Clínica (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Clínica Dental Soto (Madrid)"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Especialidad Sanitaria
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Odontología General">Odontología General</option>
                    <option value="Implantología y Cirugía Bucal">Implantología y Cirugía Bucal</option>
                    <option value="Ortodoncia">Ortodoncia</option>
                    <option value="Endodoncia">Endodoncia</option>
                    <option value="Periodoncia">Periodoncia</option>
                    <option value="Odontopediatría">Odontopediatría</option>
                    <option value="Podología Clínica">Podología Clínica</option>
                    <option value="Oftalmología">Oftalmología</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Medicina General y Cirugía">Medicina General y Cirugía</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Se publicará con distintivo de <strong>Profesional Verificado</strong></span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? "Publicando..." : "Publicar Reseña Clínica"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Reseñas */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white p-8 text-center">
            <MessageSquarePlus className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              {filterRating
                ? `No hay opiniones con ${filterRating} estrellas todavía.`
                : "Aún no hay reseñas clínicas para este producto."}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Como profesional sanitario verificado, puedes ser el primero en compartir tu experiencia de compra o uso en clínica.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              size="sm"
              className="mt-4 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Sé el primero en opinar
            </Button>
          </Card>
        ) : (
          filteredReviews.map((rev) => {
            const hasVoted = votedReviews[rev.id];

            return (
              <Card key={rev.id} className="border-gray-200 shadow-xs hover:border-gray-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    {/* Usuario e info clínica */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-800 text-sm shrink-0">
                        {rev.user_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{rev.user_name}</span>
                          {rev.is_verified_buyer === 1 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              Clínica Verificada
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 mt-0.5">
                          {rev.clinic_name && (
                            <span className="font-medium text-gray-700 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              {rev.clinic_name}
                            </span>
                          )}
                          {rev.clinic_name && <span>•</span>}
                          <span>{rev.specialty}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estrellas y Fecha */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(rev.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Título y comentario */}
                  <div className="space-y-1.5 sm:pl-13">
                    <h4 className="text-sm font-bold text-gray-900">{rev.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                  </div>

                  {/* Acciones: botón útil */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                    <button
                      onClick={() => handleHelpful(rev.id)}
                      disabled={hasVoted}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                        hasVoted
                          ? "bg-emerald-50 text-emerald-700 font-semibold cursor-default"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? "fill-emerald-600 text-emerald-600" : ""}`} />
                      {hasVoted ? "¡Gracias por tu voto!" : "¿Te ha resultado útil?"}
                      {rev.helpful_count > 0 && (
                        <span className="ml-1 text-gray-400">({rev.helpful_count})</span>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
