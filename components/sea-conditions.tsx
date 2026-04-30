"use client"

import { Waves } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WaveInfo } from "@/components/wave-info"
import { TideInfo } from "@/components/tide-info"

export function SeaConditions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Waves className="h-5 w-5 text-cyan-600" />
          Mar
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="onades">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="onades" className="text-sm">Onades</TabsTrigger>
            <TabsTrigger value="marees" className="text-sm">Marees</TabsTrigger>
          </TabsList>
          <TabsContent value="onades" className="mt-3">
            <div className="[&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:bg-transparent">
              <WaveInfo />
            </div>
          </TabsContent>
          <TabsContent value="marees" className="mt-3">
            <div className="[&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:bg-transparent">
              <TideInfo />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
