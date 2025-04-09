"use client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from 'react';

interface FogOfWarControlsProps {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  visibleFaction: string
  setVisibleFaction: (faction: string) => void
}

export function useFogOfWar(enabled, visibleFaction, units) {
  const [visibleUnits, setVisibleUnits] = useState([]);
  
  useEffect(() => {
    if (!enabled) {
      setVisibleUnits(units);
      return;
    }
    
    // Filtrar unidades basadas en la facción visible y reglas de detección
    const filtered = units.filter(unit => {
      // Unidades de la misma facción siempre son visibles
      if (unit.faction === visibleFaction) return true;
      
      // Implementar lógica de detección basada en distancia, tipo, etc.
      // ...
      
      return false;
    });
    
    setVisibleUnits(filtered);
  }, [enabled, visibleFaction, units]);
  
  return visibleUnits;
}

export default function FogOfWarControls({
  enabled,
  setEnabled,
  visibleFaction,
  setVisibleFaction,
}: FogOfWarControlsProps) {
  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center">
          {enabled ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
          Niebla de Guerra
        </h3>
        <Switch checked={enabled} onCheckedChange={setEnabled} id="fog-of-war-switch" />
      </div>

      {enabled && (
        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
          <p className="text-xs text-muted-foreground mb-2">
            Solo se mostrarán las unidades de la facción seleccionada:
          </p>

          <RadioGroup
            value={visibleFaction}
            onValueChange={(value) => setVisibleFaction(value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blue" id="blue-faction" className="border-blue-500" />
              <Label htmlFor="blue-faction" className="text-sm">
                Azul
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="red" id="red-faction" className="border-red-500" />
              <Label htmlFor="red-faction" className="text-sm">
                Rojo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="green" id="green-faction" className="border-green-500" />
              <Label htmlFor="green-faction" className="text-sm">
                Verde
              </Label>
            </div>
          </RadioGroup>

          <p className="text-xs text-muted-foreground mt-2">
            Las unidades de otras facciones quedarán ocultas en el mapa.
          </p>
        </div>
      )}
    </div>
  )
}


