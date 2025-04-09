"use client"

import { Button } from "@/components/ui/button"
import { PenTool, Ruler, Eye, EyeOff, Clock } from "lucide-react"

interface TopSidebarProps {
  isMeasuringDistance: boolean
  toggleMeasuringMode: () => void
  isAddingAnnotation: boolean
  toggleAnnotationMode: () => void
  showTrackMarkers: boolean
  toggleTrackMarkers: () => void
  fogOfWarEnabled: boolean
  toggleFogOfWar: () => void
}

export default function TopSidebar({
  isMeasuringDistance,
  toggleMeasuringMode,
  isAddingAnnotation,
  toggleAnnotationMode,
  showTrackMarkers,
  toggleTrackMarkers,
  fogOfWarEnabled,
  toggleFogOfWar,
}: TopSidebarProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleMeasuringMode}
        className={`text-white border-white hover:text-white ${isMeasuringDistance ? "bg-blue-700" : ""}`}
      >
        <Ruler className="w-4 h-4 mr-1" />
        {isMeasuringDistance ? "Finalizar Medición" : "Medir Distancia"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleAnnotationMode}
        className={`text-white border-white hover:text-white ${isAddingAnnotation ? "bg-blue-700" : ""}`}
      >
        <PenTool className="w-4 h-4 mr-1" />
        {isAddingAnnotation ? "Cancelar Anotación" : "Añadir Anotación"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleTrackMarkers}
        className={`text-white border-white hover:text-white ${showTrackMarkers ? "bg-blue-700" : ""}`}
      >
        <Clock className="w-4 h-4 mr-1" />
        {showTrackMarkers ? "Ocultar Marcadores" : "Mostrar Marcadores"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleFogOfWar}
        className={`text-white border-white hover:text-white ${fogOfWarEnabled ? "bg-blue-700" : ""}`}
      >
        {fogOfWarEnabled ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
        {fogOfWarEnabled ? "Desactivar Niebla" : "Niebla de Guerra"}
      </Button>
    </div>
  )
}

