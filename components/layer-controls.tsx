import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface LayerControlsProps {
  visibleLayers: {
    topography: boolean
    tacticalView: boolean
    coordinates: boolean
  }
  toggleLayer: (layer: string) => void
}

export default function LayerControls({ visibleLayers, toggleLayer }: LayerControlsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Capas del Mapa</h2>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="topography"
            checked={visibleLayers.topography}
            onCheckedChange={() => toggleLayer("topography")}
          />
          <Label htmlFor="topography">Topografía</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="tacticalView"
            checked={visibleLayers.tacticalView}
            onCheckedChange={() => toggleLayer("tacticalView")}
          />
          <Label htmlFor="tacticalView">Vista Táctica (Fondo Negro)</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="coordinates"
            checked={visibleLayers.coordinates}
            onCheckedChange={() => toggleLayer("coordinates")}
          />
          <Label htmlFor="coordinates">Rejilla de Coordenadas</Label>
        </div>
      </div>
    </div>
  )
}

