"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { UnitType, UnitColor, UnitSubtype } from "@/types/unit-types"

interface UnitFormProps {
  activeUnit: UnitType | null
  activeColor: UnitColor
  activeSubtype: UnitSubtype | null
  onSubmit: (unitData: {
    name: string
    class: string
    heading: number
    speed: number
    altitude?: number
    depth?: number
    showLabel: boolean
    subtype?: UnitSubtype
  }) => void
}

export default function UnitForm({ activeUnit, activeColor, activeSubtype, onSubmit }: UnitFormProps) {
  const [name, setName] = useState("")
  const [unitClass, setUnitClass] = useState("")
  const [heading, setHeading] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [altitude, setAltitude] = useState(10000) // Default altitude for aircraft/helicopter
  const [depth, setDepth] = useState(50) // Default depth for submarines
  const [showLabel, setShowLabel] = useState(true) // Default to show label

  // Actualizar el nombre y clase cuando cambia el subtipo
  useEffect(() => {
    if (activeSubtype) {
      setName(activeSubtype)
      setUnitClass(activeSubtype)
    }
  }, [activeSubtype])

  const handleSubmit = (e) => {
    e.preventDefault()

    const unitData = {
      name,
      class: unitClass,
      heading,
      speed,
      showLabel,
      subtype: activeSubtype || undefined,
      ...(activeUnit === "aircraft" || activeUnit === "drone" || activeUnit === "helicopter" ? { altitude } : {}),
      ...(activeUnit === "submarine" ? { depth } : {}),
    }

    onSubmit(unitData)

    // Reset form
    setName("")
    setUnitClass("")
    setHeading(0)
    setSpeed(0)
  }

  if (!activeUnit) return null

  const getMaxSpeed = () => {
    if (activeUnit === "aircraft") return 1000
    if (activeUnit === "helicopter") return 300
    if (activeUnit === "drone") return 400
    if (activeUnit === "missile") return 2000
    return 50 // Default for ships, submarines, etc.
  }

  const getMaxAltitude = () => {
    if (activeUnit === "aircraft") return 50000
    if (activeUnit === "helicopter") return 15000
    if (activeUnit === "drone") return 30000
    return 50000
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4 border-t pt-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la unidad"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="class">Clase</Label>
        <Input
          id="class"
          value={unitClass}
          onChange={(e) => setUnitClass(e.target.value)}
          placeholder="Clase de la unidad"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="heading">Rumbo: {heading}°</Label>
        <Slider
          id="heading"
          min={0}
          max={359}
          step={1}
          value={[heading]}
          onValueChange={(value) => setHeading(value[0])}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="speed">Velocidad: {speed} nudos</Label>
        <Slider
          id="speed"
          min={0}
          max={getMaxSpeed()}
          step={1}
          value={[speed]}
          onValueChange={(value) => setSpeed(value[0])}
        />
      </div>

      {(activeUnit === "aircraft" || activeUnit === "helicopter" || activeUnit === "drone") && (
        <div className="space-y-1">
          <Label htmlFor="altitude">Altitud: {altitude} pies</Label>
          <Slider
            id="altitude"
            min={0}
            max={getMaxAltitude()}
            step={100}
            value={[altitude]}
            onValueChange={(value) => setAltitude(value[0])}
          />
        </div>
      )}

      {activeUnit === "submarine" && (
        <div className="space-y-1">
          <Label htmlFor="depth">Profundidad: {depth} metros</Label>
          <Slider
            id="depth"
            min={0}
            max={500}
            step={10}
            value={[depth]}
            onValueChange={(value) => setDepth(value[0])}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="show-label" checked={showLabel} onCheckedChange={setShowLabel} />
        <Label htmlFor="show-label">Mostrar etiqueta</Label>
      </div>

      <Button type="submit" className="w-full">
        Colocar{" "}
        {activeSubtype ||
          (activeUnit === "ship"
            ? "Buque"
            : activeUnit === "aircraft"
              ? "Avión"
              : activeUnit === "submarine"
                ? "Submarino"
                : activeUnit === "helicopter"
                  ? "Helicóptero"
                  : activeUnit === "installation"
                    ? "Instalación"
                    : activeUnit === "drone"
                      ? "Drone"
                      : activeUnit === "missile"
                        ? "Misil"
                        : activeUnit === "auxiliary"
                          ? "Buque Auxiliar"
                          : activeUnit === "intelligence"
                            ? "Buque de Inteligencia"
                            : "Unidad Especial")}{" "}
        {activeColor}
      </Button>
    </form>
  )
}

