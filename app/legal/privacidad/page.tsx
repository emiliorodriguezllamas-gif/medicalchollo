import { Card, CardContent } from "@/components/ui/card";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-gray-600 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. Responsable del Tratamiento</h2>
            <p>
              MedicalChollo S.L. garantiza la protección de los datos de carácter personal de conformidad con el Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD).
            </p>

            <h2 className="text-lg font-bold text-gray-900">2. Finalidad del Tratamiento</h2>
            <p>
              Tratamos los datos facilitados por los profesionales y clínicas para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestionar el registro de usuario y el acceso a la plataforma.</li>
              <li>Tramitar la suscripción mensual de 30€/mes mediante pasarelas seguras.</li>
              <li>Enviar alertas sobre bajadas de precio solicitadas por el usuario.</li>
              <li>Atender solicitudes de soporte y contacto.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900">3. Base Jurídica</h2>
            <p>
              La base legal para el tratamiento de los datos es la ejecución de la relación contractual de suscripción y el consentimiento expreso del usuario al registrarse o enviar consultas.
            </p>

            <h2 className="text-lg font-bold text-gray-900">4. Derechos de los Usuarios</h2>
            <p>
              El usuario puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición enviando una solicitud a <strong>privacidad@medicalchollo.es</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
