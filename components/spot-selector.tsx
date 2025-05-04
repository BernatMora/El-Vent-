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
    value: "aquarius",
    label: "Aquarius",
    description: "Zona principal, acceso desde el parking principal",
  },
  {
    value: "la-gaviota",
    label: "La Gaviota",
    description: "Zona norte, con mejores condiciones para principiantes",
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
            className="w-full justify-between bg-white py-6 text-lg"
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
                      <p>{spot.label}</p>
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
