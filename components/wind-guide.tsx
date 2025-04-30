"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function WindGuide() {
  const traditionalWinds = [
    {
      name: "Tramuntana",
      direction: "N",
      description: "Vent del nord, fred i sec. Pot ser molt fort i ràfegues.",
      characteristics: "Vent offshore a Sant Pere, perillós per kitesurf.",
    },
    {
      name: "Gregal",
      direction: "NE",
      description: "Vent del nord-est, fresc i moderat.",
      characteristics: "Bon vent per kitesurf a Sant Pere, side-onshore.",
    },
    {
      name: "Llevant",
      direction: "E",
      description: "Vent de l'est, sovint porta humitat i núvols.",
      characteristics: "Vent onshore perfecte per kitesurf a Sant Pere.",
    },
    {
      name: "Xaloc",
      direction: "SE",
      description: "Vent del sud-est, càlid i humit.",
      characteristics: "Bon vent per kitesurf a Sant Pere, side-onshore.",
    },
    {
      name: "Migjorn",
      direction: "S",
      description: "Vent del sud, càlid.",
      characteristics: "Vent side-shore a Sant Pere, bo per riders experimentats.",
    },
    {
      name: "Llebeig",
      direction: "SW",
      description: "Vent del sud-oest, càlid i sec.",
      characteristics: "Vent side-offshore a Sant Pere, precaució.",
    },
    {
      name: "Ponent",
      direction: "W",
      description: "Vent de l'oest, sec i càlid a l'estiu.",
      characteristics: "Vent offshore a Sant Pere, perillós per kitesurf.",
    },
    {
      name: "Mestral",
      direction: "NW",
      description: "Vent del nord-oest, fred i sec.",
      characteristics: "Vent offshore a Sant Pere, perillós per kitesurf.",
    },
  ]

  return (
    <Card>
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Guia de Vents Tradicionals Catalans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vents">Vents Tradicionals</TabsTrigger>
            <TabsTrigger value="kitesurf">Consells per Kitesurf</TabsTrigger>
          </TabsList>
          <TabsContent value="vents" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {traditionalWinds.map((wind) => (
                <div key={wind.name} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold">{wind.name}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800">
                      {wind.direction}
                    </span>
                  </div>
                  <p className="mb-2 text-sm">{wind.description}</p>
                  <p className="text-sm text-muted-foreground">{wind.characteristics}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="kitesurf" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-bold">Direccions del vent</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm">
                  <li>
                    <span className="font-medium">Onshore:</span> Vent que bufa des del mar cap a terra. Més segur per
                    principiants ja que si hi ha problemes t'empeny cap a la platja.
                  </li>
                  <li>
                    <span className="font-medium">Offshore:</span> Vent que bufa des de terra cap al mar. Perillós,
                    especialment per principiants, ja que t'allunya de la costa.
                  </li>
                  <li>
                    <span className="font-medium">Side-shore:</span> Vent que bufa paral·lel a la costa. Ideal per
                    sessions de kitesurf.
                  </li>
                  <li>
                    <span className="font-medium">Side-onshore:</span> Combinació entre side-shore i onshore. Molt bo
                    per kitesurf.
                  </li>
                  <li>
                    <span className="font-medium">Side-offshore:</span> Combinació entre side-shore i offshore.
                    Requereix precaució.
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-bold">Consells de seguretat</h3>
                <ul className="ml-6 list-disc space-y-2 text-sm">
                  <li>Mai naveguis sol, especialment amb vents offshore.</li>
                  <li>Comprova sempre la previsió abans de sortir.</li>
                  <li>Respecta les zones designades per kitesurf.</li>
                  <li>Porta sempre equip de seguretat (armilla, casc, ganivet).</li>
                  <li>Tingues en compte les marees i corrents locals.</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
