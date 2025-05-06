"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Tipo para las imágenes de la galería
type GalleryImage = {
  id: string
  title: string
  description: string
  longDescription: string
  category: string
  imageUrl: string
  credit?: string
}

export function KitesurfGallery() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Aquí definimos las categorías de imágenes
  const categories = [
    { id: "all", name: "Tots" },
    { id: "techniques", name: "Tècniques" },
    { id: "rules", name: "Regles" },
    { id: "destinations", name: "Destinacions" },
  ]

  // Aquí definimos las imágenes de la galería con las imágenes reales proporcionadas
  const galleryImages: GalleryImage[] = [
    {
      id: "wind-window-diagram",
      title: "La Ventana de Viento",
      description: "Diagrama explicativo de las zonas de la ventana de viento",
      longDescription:
        "La ventana de viento es un concepto fundamental en kitesurf que todo rider debe comprender para navegar con seguridad y eficiencia.\n\n" +
        "La ventana de viento se divide en tres zonas principales:\n" +
        "• Zona de Potencia (rojo): Es la parte de la ventana ubicada frente al rider. Aquí es donde el kite genera la máxima potencia y velocidad, lo que impulsa al rider hacia adelante.\n" +
        "• Zona Neutra (amarillo): Está directamente sobre la cabeza del rider. En esta área, el kite tiene menos potencia y el rider puede sentir menos tracción.\n" +
        "• Zona de Borde (turquesa): Está casi detrás del rider, cerca del borde de la ventana de viento. Aquí es donde el kite pierde potencia y podrán experimentar una disminución en la velocidad y la tracción.\n\n" +
        "La ventana de viento se representa como un cuarto de esfera, con el rider en el centro. Los números del 9 al 3 representan las posiciones del kite, siendo las 12 la posición directamente sobre la cabeza del rider.\n\n" +
        "Entender la ventana de viento es esencial para:\n" +
        "• Controlar la potencia del kite durante la navegación\n" +
        "• Realizar maniobras y trucos con precisión\n" +
        "• Mantener la seguridad en situaciones de viento fuerte\n" +
        "• Optimizar el rendimiento en diferentes condiciones",
      category: "techniques",
      imageUrl: "/images/gallery/wind-window-diagram.jpeg",
    },
    {
      id: "wind-window-explanation",
      title: "¿Qué es la Ventana de Viento?",
      description: "Explicación visual del concepto de ventana de viento",
      longDescription:
        "La ventana de viento es el área en el cielo donde el kite puede volar y generar potencia. Es un concepto esencial para entender cómo funciona el kitesurf y cómo controlar el kite de manera efectiva.\n\n" +
        "Características principales:\n" +
        "• Se divide en tres zonas: la zona de potencia, la zona neutra y la zona de borde\n" +
        "• Su forma puede imaginarse como una media esfera grande\n" +
        "• Desde una vista frontal, se ve como un semicírculo con el rider en el centro\n" +
        "• Desde una vista lateral, se aprecia la profundidad de cada zona\n\n" +
        "La comprensión de la ventana de viento permite al kitesurfer:\n" +
        "• Controlar la velocidad y dirección\n" +
        "• Generar y reducir potencia según sea necesario\n" +
        "• Realizar maniobras avanzadas\n" +
        "• Navegar con mayor seguridad\n\n" +
        "Los instructores de kitesurf suelen utilizar este concepto como base fundamental en las primeras lecciones, ya que es imposible dominar este deporte sin entender cómo interactúa el kite con el viento dentro de esta ventana.",
      category: "techniques",
      imageUrl: "/images/gallery/wind-window-explanation.jpeg",
    },
    {
      id: "kitesurf-rules",
      title: "Reglas para Entrar al Agua",
      description: "Normas básicas de seguridad y prioridad en kitesurf",
      longDescription:
        "Las reglas de navegación en kitesurf son fundamentales para garantizar la seguridad de todos los riders y evitar colisiones. Estas normas son universales y deben respetarse en todos los spots.\n\n" +
        "1. Entrada al agua:\n" +
        "• El rider que entra al agua tiene PRIORIDAD\n" +
        "• Los demás riders deben ceder el paso y mantener distancia\n" +
        "• Esta regla es especialmente importante en spots concurridos\n\n" +
        "2. Rumbo de colisión:\n" +
        "• Cuando dos riders navegan en dirección de posible colisión, deben MANTENER EL RUMBO\n" +
        "• La mano derecha adelante en sentido de navegación tiene PRIORIDAD\n" +
        "• El rider sin prioridad debe ajustar su trayectoria para evitar la colisión\n\n" +
        "3. Cruce con otro rider:\n" +
        '• En un cruce, quien esté más "cerca del viento" levanta su kite\n' +
        "• El otro rider baja su kite\n" +
        "• Esta maniobra permite que ambos kites pasen a diferentes alturas, evitando enredos\n\n" +
        "Estas reglas no solo previenen accidentes sino que también facilitan una convivencia armoniosa entre todos los practicantes. Es responsabilidad de cada rider conocerlas y aplicarlas en todo momento.",
      category: "rules",
      imageUrl: "/images/gallery/kitesurf-rules.jpeg",
    },
    {
      id: "summer-destinations",
      title: "Destinos de Verano (Diciembre a Marzo)",
      description: "Mejores lugares para practicar kitesurf en verano",
      longDescription:
        "Durante los meses de diciembre a marzo (verano en el hemisferio sur), existen destinos ideales para la práctica del kitesurf caracterizados por temperaturas altas y excelentes condiciones de viento.\n\n" +
        "Zonas ideales:\n" +
        "• Hemisferio Sur\n" +
        "• Temperaturas altas, buena temporada de viento\n\n" +
        "Destinos recomendados:\n" +
        "• Chile: Ofrece spots como Matanzas y Ritoque con vientos constantes y fuertes\n" +
        "• Argentina: La zona de Mar del Plata y Costa Esmeralda presenta condiciones ideales\n" +
        "• Uruguay: Punta del Este y La Paloma son destinos populares con buenas condiciones\n" +
        "• Sudáfrica (Cape Town): Uno de los destinos más famosos del mundo, con vientos fuertes y consistentes\n" +
        "• Australia Oeste: Margaret River y Perth ofrecen excelentes condiciones\n" +
        "• Nueva Zelanda: Raglan y Takapuna presentan spots de calidad mundial\n\n" +
        "Estos destinos combinan excelentes condiciones de viento con temperaturas agradables, lo que los convierte en opciones perfectas para escapar del invierno del hemisferio norte y disfrutar de sesiones de kitesurf de calidad.",
      category: "destinations",
      imageUrl: "/images/gallery/summer-destinations.jpeg",
    },
    {
      id: "autumn-destinations",
      title: "Destinos de Otoño (Marzo a Junio)",
      description: "Mejores lugares para practicar kitesurf en otoño",
      longDescription:
        "Durante los meses de marzo a junio (otoño en el hemisferio norte), la zona ecuatorial y los países tropicales ofrecen condiciones óptimas para la práctica del kitesurf.\n\n" +
        "Zonas ideales:\n" +
        "• Zona ecuatorial y países tropicales\n" +
        "• Combinación perfecta de viento y temperatura\n\n" +
        "Destinos recomendados:\n" +
        "• Caribe (República Dominicana, Aruba): Vientos alisios constantes y aguas cristalinas\n" +
        "• Panamá y Costa Rica: Spots como Punta Chame (Panamá) y Bahía Salinas (Costa Rica) ofrecen condiciones excepcionales\n" +
        "• Perú (Paracas): Vientos fuertes y consistentes en la bahía de Paracas\n" +
        "• Venezuela: Los Roques presenta condiciones ideales con aguas turquesas\n" +
        "• Marruecos: Essaouira y Dakhla combinan cultura y excelentes condiciones para kitesurf\n" +
        "• Indonesia: Spots como Bali y Lombok ofrecen vientos constantes y aguas cálidas\n\n" +
        "Estos destinos tropicales permiten escapar del clima variable de primavera en latitudes más altas, garantizando sesiones consistentes con temperaturas agradables tanto del aire como del agua.",
      category: "destinations",
      imageUrl: "/images/gallery/autumn-destinations.jpeg",
    },
    {
      id: "spring-destinations",
      title: "Destinos de Primavera (Septiembre a Diciembre)",
      description: "Mejores lugares para practicar kitesurf en primavera",
      longDescription:
        "Durante los meses de septiembre a diciembre (primavera en el hemisferio sur), Latinoamérica y el sudeste asiático ofrecen condiciones ideales para la práctica del kitesurf.\n\n" +
        "Zonas ideales:\n" +
        "• Latinoamérica\n" +
        "• Asia sudeste\n\n" +
        "Destinos recomendados:\n" +
        "• Argentina: La costa atlántica comienza su temporada con vientos consistentes\n" +
        "• Chile: Spots como Matanzas y Ritoque ofrecen excelentes condiciones\n" +
        "• Brasil: El nordeste brasileño, especialmente Jericoacoara y Cumbuco, presenta vientos constantes\n" +
        "• Vietnam: Mui Ne ofrece vientos constantes y fuertes durante esta temporada\n" +
        "• Filipinas: Boracay y Kingfisher presentan condiciones ideales\n" +
        "• Tailandia: Hua Hin y Phuket combinan cultura, gastronomía y excelentes condiciones para kitesurf\n\n" +
        "Esta temporada marca el inicio de condiciones favorables en el hemisferio sur, mientras que el sudeste asiático mantiene vientos consistentes, ofreciendo alternativas para kitesurfistas que buscan escapar del otoño en el hemisferio norte.",
      category: "destinations",
      imageUrl: "/images/gallery/spring-destinations.jpeg",
    },
    {
      id: "winter-destinations",
      title: "Destinos de Invierno (Junio a Septiembre)",
      description: "Mejores lugares para practicar kitesurf en invierno",
      longDescription:
        "Durante los meses de junio a septiembre (invierno en el hemisferio sur), el hemisferio norte, norte de África y el Mediterráneo ofrecen condiciones ideales para la práctica del kitesurf.\n\n" +
        "Zonas ideales:\n" +
        "• Hemisferio Norte\n" +
        "• Norte de África y Mediterráneo\n\n" +
        "Destinos recomendados:\n" +
        "• Brasil: A pesar de ser invierno en el hemisferio sur, el nordeste brasileño mantiene excelentes condiciones\n" +
        "• España (Tarifa): Conocida como la capital europea del viento, ofrece condiciones excepcionales\n" +
        "• Portugal: Spots como Lagos y Guincho presentan vientos fuertes y consistentes\n" +
        "• Grecia: Las islas griegas, especialmente Paros y Naxos, combinan cultura y excelentes condiciones\n" +
        "• Marruecos: Essaouira y Dakhla mantienen vientos constantes\n" +
        "• Egipto: El Mar Rojo, especialmente Dahab y El Gouna, ofrece aguas cristalinas y vientos consistentes\n\n" +
        "Esta temporada es ideal para kitesurfistas que buscan combinar sesiones de calidad con turismo cultural en destinos mediterráneos, aprovechando el verano europeo y las excelentes condiciones de viento.",
      category: "destinations",
      imageUrl: "/images/gallery/winter-destinations.jpeg",
    },
  ]

  // Filtrar imágenes según la categoría seleccionada
  const filteredImages =
    selectedCategory === "all" ? galleryImages : galleryImages.filter((img) => img.category === selectedCategory)

  // Funciones para navegar por las imágenes
  const goToPrevious = () => {
    setCurrentImageIndex((currentIndex) => (currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((currentIndex) => (currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1))
  }

  // Asegurarse de que currentImageIndex es válido después de filtrar
  if (currentImageIndex >= filteredImages.length && filteredImages.length > 0) {
    setCurrentImageIndex(0)
  }

  const currentImage = filteredImages[currentImageIndex]

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
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          Galeria de Kitesurf
        </CardTitle>
        <CardDescription>Explora imatges i aprèn sobre diferents aspectes del kitesurf</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-4 grid w-full grid-cols-4">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {filteredImages.length > 0 ? (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={currentImage.imageUrl || "/placeholder.svg"}
                  alt={currentImage.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  <h3 className="text-xl font-bold">{currentImage.title}</h3>
                  <p>{currentImage.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 rounded-full bg-black/30 text-white hover:bg-black/50"
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{currentImage.title}</DialogTitle>
                      <DialogDescription>{currentImage.description}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <img
                        src={currentImage.imageUrl || "/placeholder.svg"}
                        alt={currentImage.title}
                        className="mb-4 aspect-video w-full rounded-md object-cover"
                      />
                      <div className="space-y-4 text-sm">
                        {currentImage.longDescription.split("\n\n").map((paragraph, index) => (
                          <div key={index}>
                            {paragraph.includes("• ") ? (
                              <ul className="ml-5 list-disc space-y-1">
                                {paragraph.split("\n").map((line, lineIndex) => (
                                  <li key={lineIndex}>{line.replace("• ", "")}</li>
                                ))}
                              </ul>
                            ) : paragraph.includes(". ") && /^\d+\./.test(paragraph) ? (
                              <ol className="ml-5 list-decimal space-y-1">
                                {paragraph.split("\n").map((line, lineIndex) => {
                                  const match = line.match(/^\d+\.\s(.+)/)
                                  return match ? <li key={lineIndex}>{match[1]}</li> : <p key={lineIndex}>{line}</p>
                                })}
                              </ol>
                            ) : (
                              <p>{paragraph}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {currentImage.credit && (
                        <p className="mt-4 text-xs text-muted-foreground">Crèdit: {currentImage.credit}</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Imatge {currentImageIndex + 1} de {filteredImages.length}
                </div>
                <div className="flex gap-1">
                  {filteredImages.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-blue-600" : "bg-gray-300"}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
              <p className="text-muted-foreground">No hi ha imatges disponibles en aquesta categoria</p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
