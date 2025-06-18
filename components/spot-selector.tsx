"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSpotStore } from "@/lib/store"

const spots = [
  {
    value: "kitesurf-point",
    label: "Kitesurf Point (Zona Nord)",
    description: "Zona nord, amb millors condicions per principiants - PER DEFECTE",
  },
  {
    value: "la-ballena",
    label: "La Ballena",
    description: "Zona principal, accés des del parking principal",
  },
  {
    value: "can-martinet",
    label: "Can Martinet (Zona Sud)",
    description: "Zona sud, amb vents més constants",
  },
]

export function SpotSelector() {
  const [open, setOpen] = useState(false)
  const { selectedSpot, setSelectedSpot } = useSpotStore()

  // Encontrar el spot seleccionado para mostrar su etiqueta
  const selectedSpotLabel = spots.find((spot) => spot.value === selectedSpot)?.label || "Selecciona un spot"

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white py-4 sm:py-6 text-sm sm:text-lg"
          >
            {selectedSpotLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar spot..." />
            <CommandList>
              <CommandEmpty>No se encontraron spots.</CommandEmpty>
              <CommandGroup>
                {spots.map((spot) => (
                  <CommandItem
                    key={spot.value}
                    value={spot.value}
                    onSelect={(currentValue) => {
                      setSelectedSpot(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedSpot === spot.value ? "opacity-100" : "opacity-0")} />
                    <div>
                      <p className={spot.value === "kitesurf-point" ? "font-semibold text-blue-700" : ""}>{spot.label}</p>
                      <p className="text-sm text-muted-foreground">{spot.description}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}