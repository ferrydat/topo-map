"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ScenarioInfo, WeatherCondition } from "@/types/unit-types"
import { CloudSun, Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, Save, FolderOpen } from "lucide-react"

interface ScenarioFormProps {
  scenarioInfo: ScenarioInfo
  onScenarioChange: (info: Partial<ScenarioInfo>) => void
  onOpenSaveDialog: () => void
  onOpenLoadDialog: () => void
}

export default function ScenarioForm({
  scenarioInfo,
  onScenarioChange,
  onOpenSaveDialog,
  onOpenLoadDialog,
}: ScenarioFormProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsEditing(false)
  }

  const getWeatherIcon = (weather: WeatherCondition) => {
    switch (weather) {
      case "clear":
        return <CloudSun className="h-5 w-5" />
      case "cloudy":
        return <Cloud className="h-5 w-5" />
      case "rain":
        return <CloudRain className="h-5 w-5" />
      case "storm":
        return <CloudLightning className="h-5 w-5" />
      case "fog":
        return <CloudFog className="h-5 w-5" />
      case "snow":
        return <Snowflake className="h-5 w-5" />
      default:
        return <CloudSun className="h-5 w-5" />
    }
  }

  const getWeatherLabel = (weather: WeatherCondition) => {
    switch (weather) {
      case "clear":
        return "Despejado"
      case "cloudy":
        return "Nublado"
      case "rain":
        return "Lluvia"
      case "storm":
        return "Tormenta"
      case "fog":
        return "Niebla"
      case "snow":
        return "Nieve"
      default:
        return "Despejado"
    }
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{scenarioInfo.name || "Nuevo Escenario"}</CardTitle>
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={onOpenSaveDialog} className="flex items-center">
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={onOpenLoadDialog}
                className="flex items-center justify-center w-full"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Load
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">{scenarioInfo.date || "No especificada"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="font-medium">{scenarioInfo.time || "00:00"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meteorología</p>
              <div className="flex items-center space-x-1 font-medium">
                {getWeatherIcon(scenarioInfo.weather)}
                <span>{getWeatherLabel(scenarioInfo.weather)}</span>
              </div>
            </div>
            {scenarioInfo.description && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-sm">{scenarioInfo.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Configuración del Escenario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="scenario-name">Nombre del Escenario</Label>
            <Input
              id="scenario-name"
              value={scenarioInfo.name}
              onChange={(e) => onScenarioChange({ name: e.target.value })}
              placeholder="Nombre del escenario"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="scenario-date">Fecha</Label>
            <Input
              id="scenario-date"
              type="date"
              value={scenarioInfo.date}
              onChange={(e) => onScenarioChange({ date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="scenario-time">Hora</Label>
            <Input
              id="scenario-time"
              type="time"
              value={scenarioInfo.time}
              onChange={(e) => onScenarioChange({ time: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="scenario-weather">Condiciones Meteorológicas</Label>
            <Select
              value={scenarioInfo.weather}
              onValueChange={(value) => onScenarioChange({ weather: value as WeatherCondition })}
            >
              <SelectTrigger id="scenario-weather">
                <SelectValue placeholder="Seleccionar condición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">
                  <div className="flex items-center space-x-2">
                    <CloudSun className="h-4 w-4" />
                    <span>Despejado</span>
                  </div>
                </SelectItem>
                <SelectItem value="cloudy">
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-4 w-4" />
                    <span>Nublado</span>
                  </div>
                </SelectItem>
                <SelectItem value="rain">
                  <div className="flex items-center space-x-2">
                    <CloudRain className="h-4 w-4" />
                    <span>Lluvia</span>
                  </div>
                </SelectItem>
                <SelectItem value="storm">
                  <div className="flex items-center space-x-2">
                    <CloudLightning className="h-4 w-4" />
                    <span>Tormenta</span>
                  </div>
                </SelectItem>
                <SelectItem value="fog">
                  <div className="flex items-center space-x-2">
                    <CloudFog className="h-4 w-4" />
                    <span>Niebla</span>
                  </div>
                </SelectItem>
                <SelectItem value="snow">
                  <div className="flex items-center space-x-2">
                    <Snowflake className="h-4 w-4" />
                    <span>Nieve</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="scenario-description">Descripción (opcional)</Label>
            <Textarea
              id="scenario-description"
              value={scenarioInfo.description || ""}
              onChange={(e) => onScenarioChange({ description: e.target.value })}
              placeholder="Descripción del escenario"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

