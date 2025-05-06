"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TeamFilterProps {
  teams: { name: string; color: string }[]
  selectedTeam: string | null
  onSelectTeam: (team: string | null) => void
}

export function TeamFilter({ teams, selectedTeam, onSelectTeam }: TeamFilterProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2">Filtrar por equipe:</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
              {selectedTeam ? selectedTeam : "Todas as equipes"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar equipe..." />
              <CommandList>
                <CommandEmpty>Nenhuma equipe encontrada.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onSelectTeam(null)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedTeam === null ? "opacity-100" : "opacity-0")} />
                    Todas as equipes
                  </CommandItem>
                  {teams.map((team) => (
                    <CommandItem
                      key={team.name}
                      onSelect={() => {
                        onSelectTeam(team.name)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedTeam === team.name ? "opacity-100" : "opacity-0")}
                        />
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: `#${team.color}` }} />
                        {team.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {selectedTeam && (
        <Button variant="ghost" size="sm" onClick={() => onSelectTeam(null)} className="h-8 px-2 text-xs">
          Limpar filtro
        </Button>
      )}
    </div>
  )
}
