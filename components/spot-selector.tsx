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
  {
    value: "la-rubina",
    label: "La Rubina",
    description: "Entre Sant Pere i Roses, menys massificat, bon per sessions llargues",
  },
]

export function SpotSelector() {
  const [open, setOpen] = useState(false)
  const { selectedSpot, setSelectedSpot } = useSpotStore()

  const selectedSpotLabel = spots.find((spot) => spot.value === selectedSpot)?.label || "Tria un spot"

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto w-full justify-between rounded-xl border-slate-200 bg-white px-3 py-3 text-left text-sm shadow-sm sm:py-4 sm:text-lg"
          >
            {selectedSpotLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Busca un spot..." />
            <CommandList>
              <CommandEmpty>No s'han trobat spots.</CommandEmpty>
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