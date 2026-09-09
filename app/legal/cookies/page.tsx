import { Card, CardContent } from "@/components/ui/card";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Cookies</h1>
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-gray-600 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. ¿Qué son las Cookies?</h2>
            <p>
              Una cookie es un fichero que se descarga en su dispositivo al acceder a determinadas páginas web. Las cookies permiten a una página web almacenar y recuperar información sobre los hábitos de navegación de un usuario para optimizar su experiencia.
            </p>

            <h2 className="text-lg font-bold text-gray-900">2. Cookies que utilizamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies técnicas y de sesión:</strong> Necesarias para mantener su sesión activa, recordar sus preferencias de búsqueda y permitir el acceso a su área de suscriptor.</li>
              <li><strong>Cookies de análisis:</strong> Permiten cuantificar el número de usuarios y realizar mediciones estadísticas del uso del comparador para mejorar el servicio.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900">3. Configuración y Desactivación</h2>
            <p>
              Puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador web (Chrome, Firefox, Safari, Edge).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
