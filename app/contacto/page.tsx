"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "clinica",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Mensaje enviado correctamente. Te responderemos en menos de 24h.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Contacto y Soporte</h1>
          <p className="mt-3 text-lg text-gray-600">
            ¿Tienes una clínica y necesitas ayuda? ¿Eres un distribuidor o tienda médica y quieres aparecer en el comparador?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-brand-100 p-3 text-brand-600 shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Email</h3>
                    <p className="text-sm text-gray-500 mt-0.5">contacto@medicalchollo.es</p>
                    <p className="text-sm text-gray-500">soporte@medicalchollo.es</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-3 border-t border-gray-100">
                  <div className="rounded-lg bg-green-100 p-3 text-green-600 shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Atención Telefónica</h3>
                    <p className="text-sm text-gray-500 mt-0.5">+34 910 000 000</p>
                    <p className="text-xs text-gray-400">Lunes a Viernes 9:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-3 border-t border-gray-100">
                  <div className="rounded-lg bg-purple-100 p-3 text-purple-600 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Sede Central</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Madrid, España</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-brand-50 border-brand-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-brand-600" />
                  <h2 className="text-sm font-bold text-brand-900">¿Eres una Tienda o Depósito?</h2>
                </div>
                <p className="text-xs text-brand-800 leading-relaxed">
                  Conectamos tu catálogo con miles de clínicas en España. Envíanos tu feed de productos o solicita la integración directa en MedicalChollo.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Rellena el formulario y te contactaremos en un plazo máximo de 24 horas laborales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-gray-900">¡Mensaje recibido con éxito!</h2>
                    <p className="text-gray-500 max-w-md mx-auto text-sm">
                      Gracias por contactar con MedicalChollo. Nuestro equipo de soporte o acuerdos comerciales revisará tu solicitud y te responderá enseguida.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Nombre o Clínica *</label>
                        <Input
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Ej: Clínica Dental Martínez"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Email de contacto *</label>
                        <Input
                          required
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="contacto@clinicamartinez.es"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Teléfono</label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Motivo de contacto *</label>
                        <select
                          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        >
                          <option value="clinica">Soy una clínica (Soporte o dudas)</option>
                          <option value="tienda">Soy tienda/distribuidor (Quiero aparecer en el comparador)</option>
                          <option value="producto">Sugerir nuevo producto o categoría</option>
                          <option value="otro">Otro asunto</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje *</label>
                      <textarea
                        required
                        rows={5}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Escribe aquí tu consulta o propuesta..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" loading={loading}>
                      <Send className="h-4 w-4" />
                      Enviar consulta
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
