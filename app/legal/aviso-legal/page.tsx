import { Card, CardContent } from "@/components/ui/card";

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-page max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Aviso Legal</h1>
        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none text-gray-600 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. Datos Identificativos</h2>
            <p>
              En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa que el sitio web <strong>MedicalChollo</strong> es titularidad de MedicalChollo S.L. con domicilio en Madrid, España, y correo electrónico de contacto: contacto@medicalchollo.es.
            </p>

            <h2 className="text-lg font-bold text-gray-900">2. Objeto de la Plataforma</h2>
            <p>
              MedicalChollo es una plataforma digital de intermediación informativa y comparador de precios orientada al sector profesional sanitario (odontología, podología, oftalmología y medicina general). La plataforma recopila y compara precios públicos ofrecidos por diferentes distribuidores y tiendas de comercio electrónico de suministros médicos.
            </p>

            <h2 className="text-lg font-bold text-gray-900">3. Naturaleza del Servicio</h2>
            <p>
              MedicalChollo no vende de forma directa los artículos mostrados en su comparador, salvo indicación expresa en contrario. La compraventa final se realiza directamente entre el usuario profesional y el comercio o distribuidor enlazado en cada oferta. MedicalChollo no se responsabiliza de roturas de stock, variaciones puntuales de precio producidas entre ciclos de rastreo, o incidencias en el envío o facturación de los proveedores externos.
            </p>

            <h2 className="text-lg font-bold text-gray-900">4. Propiedad Intelectual</h2>
            <p>
              Las marcas comerciales, logotipos, imágenes de producto y referencias comerciales mencionadas pertenecen a sus respectivos fabricantes y distribuidores, utilizándose exclusivamente con fines de identificación y comparación informativa de acuerdo a la legislación vigente de la Unión Europea sobre derecho a la libre competencia y transparencia de mercado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
