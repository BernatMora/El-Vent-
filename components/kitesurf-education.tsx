"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function KitesurfEducation() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          Aprèn Kitesurf
        </CardTitle>
        <CardDescription>Guia educativa per entendre els conceptes bàsics del kitesurf</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basics">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="basics">Conceptes Bàsics</TabsTrigger>
            <TabsTrigger value="safety">Seguretat</TabsTrigger>
            <TabsTrigger value="seasons">Temporades</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-lg font-bold">La Ventana de Viento</h3>
              <p className="mb-4 text-sm">
                La ventana de viento es el área en el cielo donde el kite puede volar y generar potencia. Entender este
                concepto es fundamental para controlar el kite correctamente.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <img
                    src="/images/gallery/wind-window-diagram.jpeg"
                    alt="Diagrama de la ventana de viento"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Diagrama detallado de las zonas de la ventana de viento y su efecto en la potencia del kite.
                  </p>
                </div>
                <div>
                  <img
                    src="/images/gallery/wind-window-explanation.jpeg"
                    alt="Explicación de la ventana de viento"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Visualización de la ventana de viento desde diferentes ángulos y su aplicación práctica.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-lg font-bold">Zonas de la Ventana de Viento</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-red-50 p-3">
                  <h4 className="font-medium text-red-700">Zona de Potencia</h4>
                  <p className="text-sm">
                    Es la parte de la ventana ubicada frente al rider. Aquí es donde el kite genera la máxima potencia y
                    velocidad, lo que impulsa al rider hacia adelante.
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <h4 className="font-medium text-yellow-700">Zona Neutra</h4>
                  <p className="text-sm">
                    Está directamente sobre la cabeza del rider. En esta área, el kite tiene menos potencia y el rider
                    puede sentir menos tracción.
                  </p>
                </div>
                <div className="rounded-lg bg-cyan-50 p-3">
                  <h4 className="font-medium text-cyan-700">Zona de Borde</h4>
                  <p className="text-sm">
                    Está casi detrás del rider, cerca del borde de la ventana de viento. Aquí es donde el kite pierde
                    potencia y podrán experimentar una disminución en la velocidad y la tracción.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-lg font-bold">Reglas para Entrar al Agua</h3>
              <p className="mb-4 text-sm">
                Las reglas de navegación en kitesurf son fundamentales para garantizar la seguridad de todos los riders
                y evitar colisiones.
              </p>
              <img src="/images/gallery/kitesurf-rules.jpeg" alt="Reglas de kitesurf" className="mb-2 rounded-md" />
              <div className="space-y-2">
                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="font-medium text-blue-700">Entrada al Agua</h4>
                  <p className="text-sm">
                    Recordá que el rider que entra al agua tiene PRIORIDAD. Los demás riders deben ceder el paso y
                    mantener distancia.
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="font-medium text-blue-700">Rumbo de Colisión</h4>
                  <p className="text-sm">
                    Mano derecha adelante en sentido navegación PRIORIDAD. Mantener el rumbo es esencial para evitar
                    accidentes.
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="font-medium text-blue-700">Cruce con Otro Rider</h4>
                  <p className="text-sm">
                    En un cruce, quien esté más "cerca del viento" levanta su kite y el otro lo baja. Esta maniobra
                    permite que ambos kites pasen a diferentes alturas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-lg font-bold">Consejos de Seguridad Adicionales</h3>
              <div className="space-y-2">
                <div className="rounded-lg bg-amber-50 p-3">
                  <h4 className="font-medium text-amber-700">Antes de Entrar al Agua</h4>
                  <ul className="ml-4 list-disc text-sm">
                    <li>Verifica siempre tu equipo: líneas, sistema de seguridad y kite</li>
                    <li>Comprueba las condiciones meteorológicas y las previsiones</li>
                    <li>Nunca practiques kitesurf solo, especialmente en spots nuevos</li>
                    <li>Respeta las zonas designadas para kitesurf y a otros usuarios de la playa</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <h4 className="font-medium text-amber-700">Durante la Sesión</h4>
                  <ul className="ml-4 list-disc text-sm">
                    <li>Mantén siempre una distancia segura con otros riders y obstáculos</li>
                    <li>Presta atención a cambios en el viento o condiciones climáticas</li>
                    <li>No sobrestimes tus habilidades, especialmente en condiciones desafiantes</li>
                    <li>Lleva siempre contigo un cuchillo de seguridad para cortar líneas en caso de emergencia</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seasons" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-lg font-bold">Destinos por Temporada</h3>
              <p className="mb-4 text-sm">
                El kitesurf es un deporte que puede practicarse durante todo el año si sabes dónde ir. Aquí te mostramos
                los mejores destinos según la temporada.
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">Verano (Diciembre a Marzo)</h4>
                  <img
                    src="/images/gallery/summer-destinations.jpeg"
                    alt="Destinos de verano"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Durante el verano del hemisferio sur, países como Chile, Argentina, Uruguay, Sudáfrica, Australia
                    Oeste y Nueva Zelanda ofrecen condiciones ideales.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Otoño (Marzo a Junio)</h4>
                  <img
                    src="/images/gallery/autumn-destinations.jpeg"
                    alt="Destinos de otoño"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    En otoño, la zona ecuatorial y países tropicales como el Caribe, Panamá, Costa Rica, Perú,
                    Venezuela, Marruecos e Indonesia son ideales.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Invierno (Junio a Septiembre)</h4>
                  <img
                    src="/images/gallery/winter-destinations.jpeg"
                    alt="Destinos de invierno"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Durante el invierno del hemisferio sur, el hemisferio norte, norte de África y Mediterráneo ofrecen
                    excelentes condiciones en lugares como Brasil, España, Portugal, Grecia, Marruecos y Egipto.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">Primavera (Septiembre a Diciembre)</h4>
                  <img
                    src="/images/gallery/spring-destinations.jpeg"
                    alt="Destinos de primavera"
                    className="mb-2 rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    En primavera, Latinoamérica y el sudeste asiático son las zonas ideales, con destinos como
                    Argentina, Chile, Brasil, Vietnam, Filipinas y Tailandia.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
