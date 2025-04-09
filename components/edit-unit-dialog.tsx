"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Ship,
  Plane,
  ShipIcon as Submarine,
  BirdIcon as Helicopter,
  Building,
  MapPin,
  Rocket,
  Shield,
  Radio,
  Waves,
  Ear,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Unit, UnitSubtype, Sensors } from "@/types/unit-types"

interface EditUnitDialogProps {
  unit: Unit | null
  isOpen: boolean
  onClose: () => void
  onSave: (unitId: string, updatedData: Partial<Unit>) => void
}

export default function EditUnitDialog({ unit, isOpen, onClose, onSave }: EditUnitDialogProps) {
  const [name, setName] = useState("")
  const [unitClass, setUnitClass] = useState("")
  const [heading, setHeading] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [altitude, setAltitude] = useState(10000)
  const [depth, setDepth] = useState(50)
  const [showLabel, setShowLabel] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [subtype, setSubtype] = useState<UnitSubtype | null>(null)
  const [labelOffsetX, setLabelOffsetX] = useState(0)
  const [labelOffsetY, setLabelOffsetY] = useState(0.02) // Valor predeterminado
  const [detected, setDetected] = useState(true)

  // Sensors state
  const [sensors, setSensors] = useState<Sensors>({
    radar: { range: 50, active: false },
    activeSonar: { range: 20, active: false },
    passiveSonar: { range: 30, active: false },
  })

  // Update form when unit changes
  useEffect(() => {
    if (unit) {
      setName(unit.name)
      setUnitClass(unit.class)
      setHeading(unit.heading)
      setSpeed(unit.speed)
      setAltitude(unit.altitude || 10000)
      setDepth(unit.depth || 50)
      setShowLabel(unit.showLabel)
      setSubtype(unit.subtype || null)
      setDetected(unit.detected !== undefined ? unit.detected : true) // Valor por defecto: true
      setActiveTab("general")

      // Initialize sensors with unit data or defaults
      setSensors({
        radar: unit.sensors?.radar || { range: 50, active: false },
        activeSonar: unit.sensors?.activeSonar || { range: 20, active: false },
        passiveSonar: unit.sensors?.passiveSonar || { range: 30, active: false },
      })

      // Inicializar offset de etiqueta
      setLabelOffsetX(unit.labelOffset?.x || 0)
      setLabelOffsetY(unit.labelOffset?.y || 0.02)
    }
  }, [unit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!unit) return

    const updatedData: Partial<Unit> = {
      name,
      class: unitClass,
      heading,
      speed,
      showLabel,
      subtype,
      sensors,
      detected,
      labelOffset: {
        x: labelOffsetX,
        y: labelOffsetY,
      },
      ...(unit.type === "aircraft" || unit.type === "helicopter" || unit.type === "drone" ? { altitude } : {}),
      ...(unit.type === "submarine" ? { depth } : {}),
    }

    onSave(unit.id, updatedData)
    onClose()
  }

  const getUnitIcon = () => {
    if (!unit) return null

    switch (unit.type) {
      case "ship":
      case "auxiliary":
      case "intelligence":
        return <Ship className="h-6 w-6" />
      case "aircraft":
      case "drone":
        return <Plane className="h-6 w-6" />
      case "submarine":
        return <Submarine className="h-6 w-6" />
      case "helicopter":
        return <Helicopter className="h-6 w-6" />
      case "installation":
        return <Building className="h-6 w-6" />
      case "missile":
        return <Rocket className="h-6 w-6" />
      case "special":
        return <Shield className="h-6 w-6" />
      default:
        return null
    }
  }

  const getUnitTypeLabel = () => {
    if (!unit) return ""

    switch (unit.type) {
      case "ship":
        return "Buque de Guerra"
      case "aircraft":
        return "Avión"
      case "submarine":
        return "Submarino"
      case "helicopter":
        return "Helicóptero"
      case "installation":
        return "Instalación"
      case "auxiliary":
        return "Buque Auxiliar"
      case "intelligence":
        return "Buque de Inteligencia"
      case "drone":
        return "Drone/UAV"
      case "missile":
        return "Misil"
      case "special":
        return "Unidad Especial"
      default:
        return ""
    }
  }

  const getUnitColorClass = () => {
    if (!unit) return ""

    switch (unit.color) {
      case "red":
        return "text-red-500"
      case "green":
        return "text-green-500"
      case "blue":
        return "text-blue-500"
      default:
        return ""
    }
  }

  // Obtener los subtipos disponibles para el tipo de unidad actual
  const getAvailableSubtypes = () => {
    if (!unit) return []

    switch (unit.type) {
      case "aircraft":
        return [
          "Avión de Patrulla Marítima",
          "Avión de Reconocimiento",
          "Avión de Transporte",
          "Bombardero Estratégico",
          "Caza de Cuarta Generación",
          "Caza de Quinta Generación",
        ]
      case "ship":
        return ["Corbeta", "Crucero Lanzamisiles", "Destructor", "Fragata", "Lancha Misilera", "Portaaviones"]
      case "auxiliary":
        return ["Buque Hospital", "Buque de Reabastecimiento", "Transporte Anfibio"]
      case "intelligence":
        return ["Barcos Espías", "Sistemas de Vigilancia Naval"]
      case "drone":
        return ["Bayraktar TB2", "MQ-9 Reaper", "S-70 Okhotnik-B"]
      case "helicopter":
        return [
          "Helicóptero ASW",
          "Helicóptero Ligero",
          "Helicóptero de Ataque",
          "Helicóptero de Transporte",
          "Helicóptero de Transporte Pesado",
          "Helicóptero de Uso General",
        ]
      case "installation":
        return [
          "Base Aérea",
          "Base Naval",
          "Batería SAM",
          "Centro de Mando",
          "Depósito de Municiones",
          "Estación de Comunicaciones",
          "Instalación Submarina",
          "Plataforma de Misiles",
          "Radar Costero",
        ]
      case "missile":
        return [
          "Misil Antibuque",
          "Misiles Hipersónicos",
          "Railgun",
          "SLBM",
          "SSM/Cruise",
          "Sistemas de Ataque a Larga Distancia",
          "Torpedo",
        ]
      case "submarine":
        return ["Submarino AIP", "Submarino Balístico Nuclear", "Submarino Convencional", "Submarino de Ataque Nuclear"]
      case "special":
        return ["Fuerzas de Operaciones Especiales Navales", "SEALs", "Spetsnaz Marinos"]
      default:
        return []
    }
  }

  // Handle sensor changes
  const handleSensorChange = (
    sensorType: "radar" | "activeSonar" | "passiveSonar",
    field: "range" | "active",
    value: number | boolean,
  ) => {
    setSensors((prev) => ({
      ...prev,
      [sensorType]: {
        ...prev[sensorType],
        [field]: value,
      },
    }))
  }

  // Determine which sensors to show based on unit type
  const showRadar = unit?.type !== "missile"
  const showSonar = unit?.type === "ship" || unit?.type === "submarine" || unit?.type === "auxiliary"

  if (!unit) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={getUnitColorClass()}>{getUnitIcon()}</div>
            <div>
              <DialogTitle>Editar Unidad</DialogTitle>
              <DialogDescription>
                {getUnitTypeLabel()} {unit.color} - ID: {unit.id.substring(0, 8)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="movement">Movimiento</TabsTrigger>
            <TabsTrigger value="sensors">Sensores</TabsTrigger>
            <TabsTrigger value="label">Etiqueta</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class" className="text-right">
                Clase
              </Label>
              <Input
                id="class"
                value={unitClass}
                onChange={(e) => setUnitClass(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subtype" className="text-right">
                Subtipo
              </Label>
              <div className="col-span-3">
                <Select value={subtype || ""} onValueChange={(value) => setSubtype(value as UnitSubtype)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un subtipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{getUnitTypeLabel()}</SelectLabel>
                      {getAvailableSubtypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="show-label" className="text-right">
                Mostrar etiqueta
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch id="show-label" checked={showLabel} onCheckedChange={setShowLabel} />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="detected" className="text-right">
                Estado de detección
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch id="detected" checked={detected} onCheckedChange={setDetected} />
                <span className="ml-2 text-sm">{detected ? "Detectado" : "No detectado"}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Posición</Label>
              <div className="col-span-3">
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {unit.position[0].toFixed(4)}, {unit.position[1].toFixed(4)}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Historial</Label>
              <div className="col-span-3">
                <span className="text-sm">{unit.trackHistory.length} posiciones registradas</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="movement" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="heading" className="text-right">
                Rumbo
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">0°</span>
                  <span className="font-bold">{heading}°</span>
                  <span className="text-sm">359°</span>
                </div>
                <Slider
                  id="heading"
                  min={0}
                  max={359}
                  step={1}
                  value={[heading]}
                  onValueChange={(value) => setHeading(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Norte</span>
                  <span>Este</span>
                  <span>Sur</span>
                  <span>Oeste</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speed" className="text-right">
                Velocidad
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">0 kn</span>
                  <span className="font-bold">{speed} kn</span>
                  <span className="text-sm">
                    {unit.type === "aircraft"
                      ? "1000 kn"
                      : unit.type === "helicopter"
                        ? "300 kn"
                        : unit.type === "missile"
                          ? "2000 kn"
                          : unit.type === "drone"
                            ? "400 kn"
                            : "50 kn"}
                  </span>
                </div>
                <Slider
                  id="speed"
                  min={0}
                  max={
                    unit.type === "aircraft"
                      ? 1000
                      : unit.type === "helicopter"
                        ? 300
                        : unit.type === "missile"
                          ? 2000
                          : unit.type === "drone"
                            ? 400
                            : 50
                  }
                  step={1}
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>
            </div>

            {(unit.type === "aircraft" || unit.type === "helicopter" || unit.type === "drone") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="altitude" className="text-right">
                  Altitud
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">0 ft</span>
                    <span className="font-bold">{altitude} ft</span>
                    <span className="text-sm">
                      {unit.type === "aircraft" ? "50000 ft" : unit.type === "drone" ? "30000 ft" : "15000 ft"}
                    </span>
                  </div>
                  <Slider
                    id="altitude"
                    min={0}
                    max={unit.type === "aircraft" ? 50000 : unit.type === "drone" ? 30000 : 15000}
                    step={100}
                    value={[altitude]}
                    onValueChange={(value) => setAltitude(value[0])}
                  />
                </div>
              </div>
            )}

            {unit.type === "submarine" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="depth" className="text-right">
                  Profundidad
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">0 m</span>
                    <span className="font-bold">{depth} m</span>
                    <span className="text-sm">500 m</span>
                  </div>
                  <Slider
                    id="depth"
                    min={0}
                    max={500}
                    step={10}
                    value={[depth]}
                    onValueChange={(value) => setDepth(value[0])}
                  />
                </div>
              </div>
            )}

            {unit.plannedMovement && (
              <div className="mt-4 p-3 bg-primary/10 rounded-md">
                <h4 className="text-sm font-semibold mb-2">Movimiento Planificado</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Rumbo:</span> {unit.plannedMovement.heading}°
                  </div>
                  <div>
                    <span className="font-medium">Velocidad:</span> {unit.plannedMovement.speed} kn
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Turno:</span> {unit.plannedMovement.turn}
                  </div>
                </div>
              </div>
            )}

            {unit.waypoints && unit.waypoints.length > 0 && (
              <div
                className={`mt-4 p-3 rounded-md ${unit.followingWaypoints ? "bg-green-100/50 dark:bg-green-900/20" : "bg-secondary/10"}`}
              >
                <h4 className="text-sm font-semibold mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Waypoints
                  {unit.followingWaypoints && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                      (Siguiendo ruta)
                    </span>
                  )}
                </h4>
                <div className="text-sm">
                  <div>
                    <span className="font-medium">Total:</span> {unit.waypoints.length} waypoints
                  </div>
                  <div>
                    <span className="font-medium">Completados:</span>{" "}
                    {unit.waypoints.filter((wp) => wp.completed).length}
                  </div>
                  {unit.waypoints.some((wp) => !wp.completed) && (
                    <div>
                      <span className="font-medium">Próximo:</span>{" "}
                      {unit.waypoints.find((wp) => !wp.completed)?.name || "Ninguno"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sensors" className="space-y-4">
            {showRadar && (
              <div className="border rounded-md p-3">
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                  <Radio className="h-4 w-4 mr-2" />
                  Radar
                </h3>

                <div className="grid grid-cols-4 items-center gap-4 mb-2">
                  <Label htmlFor="radar-range" className="text-right">
                    Alcance
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">0 NM</span>
                      <span className="font-bold">{sensors.radar?.range} NM</span>
                      <span className="text-sm">200 NM</span>
                    </div>
                    <Slider
                      id="radar-range"
                      min={0}
                      max={200}
                      step={5}
                      value={[sensors.radar?.range || 0]}
                      onValueChange={(value) => handleSensorChange("radar", "range", value[0])}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="radar-active" className="text-right">
                    Activo
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Switch
                      id="radar-active"
                      checked={sensors.radar?.active || false}
                      onCheckedChange={(checked) => handleSensorChange("radar", "active", checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {showSonar && (
              <>
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <Waves className="h-4 w-4 mr-2" />
                    Sonar Activo
                  </h3>

                  <div className="grid grid-cols-4 items-center gap-4 mb-2">
                    <Label htmlFor="active-sonar-range" className="text-right">
                      Alcance
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">0 NM</span>
                        <span className="font-bold">{sensors.activeSonar?.range} NM</span>
                        <span className="text-sm">50 NM</span>
                      </div>
                      <Slider
                        id="active-sonar-range"
                        min={0}
                        max={50}
                        step={1}
                        value={[sensors.activeSonar?.range || 0]}
                        onValueChange={(value) => handleSensorChange("activeSonar", "range", value[0])}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active-sonar-active" className="text-right">
                      Activo
                    </Label>
                    <div className="col-span-3 flex items-center">
                      <Switch
                        id="active-sonar-active"
                        checked={sensors.activeSonar?.active || false}
                        onCheckedChange={(checked) => handleSensorChange("activeSonar", "active", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold mb-3 flex items-center">
                    <Ear className="h-4 w-4 mr-2" />
                    Sonar Pasivo
                  </h3>

                  <div className="grid grid-cols-4 items-center gap-4 mb-2">
                    <Label htmlFor="passive-sonar-range" className="text-right">
                      Alcance
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">0 NM</span>
                        <span className="font-bold">{sensors.passiveSonar?.range} NM</span>
                        <span className="text-sm">80 NM</span>
                      </div>
                      <Slider
                        id="passive-sonar-range"
                        min={0}
                        max={80}
                        step={1}
                        value={[sensors.passiveSonar?.range || 0]}
                        onValueChange={(value) => handleSensorChange("passiveSonar", "range", value[0])}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="passive-sonar-active" className="text-right">
                      Activo
                    </Label>
                    <div className="col-span-3 flex items-center">
                      <Switch
                        id="passive-sonar-active"
                        checked={sensors.passiveSonar?.active || false}
                        onCheckedChange={(checked) => handleSensorChange("passiveSonar", "active", checked)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {!showRadar && !showSonar && (
              <div className="text-center p-4 text-muted-foreground">
                Este tipo de unidad no tiene sensores disponibles.
              </div>
            )}
          </TabsContent>

          <TabsContent value="label" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="show-label" className="text-right">
                Mostrar etiqueta
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch id="show-label" checked={showLabel} onCheckedChange={setShowLabel} />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label-offset-x" className="text-right">
                Posición X
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">-0.1</span>
                  <span className="font-bold">{labelOffsetX.toFixed(3)}</span>
                  <span className="text-sm">0.1</span>
                </div>
                <Slider
                  id="label-offset-x"
                  min={-0.1}
                  max={0.1}
                  step={0.001}
                  value={[labelOffsetX]}
                  onValueChange={(value) => setLabelOffsetX(value[0])}
                />
                <div className="text-xs text-muted-foreground">Ajusta la posición horizontal de la etiqueta</div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label-offset-y" className="text-right">
                Posición Y
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">-0.1</span>
                  <span className="font-bold">{labelOffsetY.toFixed(3)}</span>
                  <span className="text-sm">0.1</span>
                </div>
                <Slider
                  id="label-offset-y"
                  min={-0.1}
                  max={0.1}
                  step={0.001}
                  value={[labelOffsetY]}
                  onValueChange={(value) => setLabelOffsetY(value[0])}
                />
                <div className="text-xs text-muted-foreground">Ajusta la posición vertical de la etiqueta</div>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md text-sm">
              <p>Puedes arrastrar la etiqueta directamente en el mapa para posicionarla.</p>
              <p className="mt-1">Los cambios se guardarán automáticamente.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center pt-4">
          <div className="text-xs text-muted-foreground">Última actualización: {new Date().toLocaleString()}</div>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmit}>
              Guardar cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

