"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { ThemeProvider } from "@/components/theme-provider"
import LayerControls from "./layer-controls"
import UnitControls from "./unit-controls"
import ScenarioForm from "./scenario-form"
import { ThemeToggle } from "./theme-toggle"
import type {
  Unit,
  UnitType,
  UnitColor,
  UnitSubtype,
  TurnState,
  ScenarioInfo,
  Position,
  Waypoint,
} from "@/types/unit-types"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { PenTool, MapPin } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import UnitForm from "./unit-form"
import TurnManager from "./turn-manager"
import UnitList from "./unit-list"
import EditUnitDialog from "./edit-unit-dialog"
import PlanMovementDialog from "./plan-movement-dialog"
import WaypointsDialog from "./waypoints-dialog"
import SaveScenarioDialog from "./save-scenario-dialog"
import LoadScenarioDialog from "./load-scenario-dialog"
import CoordinateDisplay from "./coordinate-display"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/toaster"

// Add these imports at the top of the file
import TopSidebar from "./top-sidebar"
import FogOfWarControls from "./fog-of-war-controls"

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <p className="text-lg font-semibold">Cargando Mapa...</p>
    </div>
  ),
})

// Helper function to calculate new position based on heading, speed and time
function calculateNewPosition(
  currentPosition: [number, number],
  heading: number,
  speed: number,
  timeInMinutes: number,
): [number, number] {
  // Convert heading from degrees to radians
  // Note: 0° is North, 90° is East, etc.
  const headingRad = (90 - heading) * (Math.PI / 180)

  // Calculate distance traveled in degrees
  // Approximate conversion: 1 knot ≈ 0.0003 degrees per minute at the equator
  // This is a simplification and varies with latitude
  const distanceFactor = 0.0003
  const distance = speed * timeInMinutes * distanceFactor

  // Calculate new position
  const newLat = currentPosition[0] + distance * Math.sin(headingRad)
  const newLng = currentPosition[1] + distance * Math.cos(headingRad)

  return [newLat, newLng]
}

// Helper function to calculate heading between two points
function calculateHeading(from: [number, number], to: [number, number]): number {
  // Convert latitude and longitude from degrees to radians
  const lat1 = (from[0] * Math.PI) / 180
  const lon1 = (from[1] * Math.PI) / 180
  const lat2 = (to[0] * Math.PI) / 180
  const lon2 = (to[1] * Math.PI) / 180

  // Calculate y and x components
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)

  // Calculate heading in radians and convert to degrees
  let heading = (Math.atan2(y, x) * 180) / Math.PI

  // Normalize to 0-360 degrees
  heading = (heading + 360) % 360

  return heading
}

// Helper function to calculate distance between two points in nautical miles
function calculateDistance(from: [number, number], to: [number, number]): number {
  const R = 6371 // Earth's radius in km
  const lat1 = (from[0] * Math.PI) / 180
  const lat2 = (to[0] * Math.PI) / 180
  const dLat = ((to[0] - from[0]) * Math.PI) / 180
  const dLng = ((to[1] - from[1]) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance * 0.539957 // Convert km to nautical miles
}

// Type for saved scenario
interface SavedScenario {
  id: string
  name: string
  date: string
  scenarioInfo: ScenarioInfo
  turnState: TurnState
  units: Unit[]
  annotations?: Annotation[]
}

// Type for map annotations
interface Annotation {
  id: string
  position: [number, number]
  title: string
  text: string
  color: string
}

export default function MapApplication() {
  const [activeUnit, setActiveUnit] = useState<UnitType | null>(null)
  const [activeColor, setActiveColor] = useState<UnitColor>("blue")
  const [activeSubtype, setActiveSubtype] = useState<UnitSubtype | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [clickPosition, setClickPosition] = useState<[number, number] | null>(null)
  const [visibleLayers, setVisibleLayers] = useState({
    topography: true,
    tacticalView: false,
    coordinates: true,
  })
  const [isMeasuringDistance, setIsMeasuringDistance] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([])
  const [measurementUnit, setMeasurementUnit] = useState("nm") // Default to nautical miles
  const [showTrackMarkers, setShowTrackMarkers] = useState(true) // Estado para mostrar/ocultar marcadores de tiempo

  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)
  const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null)
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null)

  // Inicializar la hora actual del escenario
  const currentDate = new Date()
  const formattedTime = `${currentDate.getHours().toString().padStart(2, "0")}:${currentDate.getMinutes().toString().padStart(2, "0")}`

  const [scenarioInfo, setScenarioInfo] = useState<ScenarioInfo>({
    name: "Nuevo Escenario",
    date: new Date().toISOString().split("T")[0],
    time: formattedTime,
    weather: "clear",
  })

  const [turnState, setTurnState] = useState<TurnState>({
    currentTurn: 1,
    turnType: "tactical",
    tacticalTurnDuration: 30 * 60, // 30 minutos en segundos
    intermediateTurnDuration: 3 * 60, // 3 minutos en segundos
    currentTime: new Date(), // Hora actual
  })

  const [isSimulating, setIsSimulating] = useState(false)
  const [unitToCenter, setUnitToCenter] = useState<Unit | null>(null)
  const [isRealTime, setIsRealTime] = useState(false)
  const [realTimeProgress, setRealTimeProgress] = useState(0)
  const [lastRealTimeUpdate, setLastRealTimeUpdate] = useState(Date.now())

  // Unit management states
  const [isMovingUnit, setIsMovingUnit] = useState(false)
  const [unitToMove, setUnitToMove] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null)
  const [isPlanMovementDialogOpen, setIsPlanMovementDialogOpen] = useState(false)
  const [unitToPlan, setUnitToPlan] = useState<Unit | null>(null)

  // Waypoints states
  const [isWaypointsDialogOpen, setIsWaypointsDialogOpen] = useState(false)
  const [unitForWaypoints, setUnitForWaypoints] = useState<Unit | null>(null)
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false)
  const [unitIdForWaypoint, setUnitIdForWaypoint] = useState<string | null>(null)

  // Save/Load states
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([])

  // Store unit history for undo/redo
  const [unitsHistory, setUnitsHistory] = useState<Unit[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Añadir el estado para el multiplicador de velocidad y el offset de etiquetas
  const [speedMultiplier, setSpeedMultiplier] = useState(1) // 1x es la velocidad normal
  const [labelOffsets, setLabelOffsets] = useState({}) // Almacenar offsets de etiquetas por ID de unidad

  // Add these state variables in the MapApplication component
  const [fogOfWarEnabled, setFogOfWarEnabled] = useState(false)
  const [fogOfWarFaction, setFogOfWarFaction] = useState<UnitColor>("blue")

  // Add current units state to history
  const addToHistory = useCallback(
    (currentUnits: Unit[]) => {
      // If we're not at the end of the history, truncate it
      if (historyIndex < unitsHistory.length - 1) {
        setUnitsHistory((prev) => prev.slice(0, historyIndex + 1))
      }

      setUnitsHistory((prev) => [...prev, JSON.parse(JSON.stringify(currentUnits))])
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex, unitsHistory],
  )

  // Load saved scenarios from localStorage on mount
  useEffect(() => {
    const loadSavedScenarios = () => {
      try {
        const savedScenariosJson = localStorage.getItem("savedScenarios")
        if (savedScenariosJson) {
          const parsed = JSON.parse(savedScenariosJson)
          setSavedScenarios(parsed)
        }
      } catch (error) {
        console.error("Error loading saved scenarios:", error)
      }
    }

    loadSavedScenarios()
  }, [])

  // Sincronizar la hora del escenario con el estado de turnos
  useEffect(() => {
    if (scenarioInfo.time) {
      const [hours, minutes] = scenarioInfo.time.split(":").map(Number)
      const newTime = new Date()
      newTime.setHours(hours, minutes, 0, 0)

      setTurnState((prev) => ({
        ...prev,
        currentTime: newTime,
      }))
    }
  }, [scenarioInfo.time])

  // Toggle distance measuring mode
  const toggleMeasuringMode = useCallback(() => {
    // If adding annotation, cancel it
    if (isAddingAnnotation) {
      setIsAddingAnnotation(false)
    }

    setIsMeasuringDistance(!isMeasuringDistance)
    setMeasurePoints([])

    if (isMeasuringDistance) {
      toast({
        title: "Medición finalizada",
        description: "Se ha desactivado el modo de medición de distancias.",
      })
    } else {
      toast({
        title: "Medición activada",
        description: "Haz clic en el mapa para marcar puntos y medir distancias.",
      })
    }
  }, [isMeasuringDistance, isAddingAnnotation])

  // Toggle annotation mode
  const toggleAnnotationMode = useCallback(() => {
    // If measuring distance, cancel it
    if (isMeasuringDistance) {
      setIsMeasuringDistance(false)
      setMeasurePoints([])
    }

    setIsAddingAnnotation(!isAddingAnnotation)

    if (isAddingAnnotation) {
      toast({
        title: "Modo anotación desactivado",
        description: "Se ha desactivado el modo de añadir anotaciones.",
      })
    } else {
      toast({
        title: "Modo anotación activado",
        description: "Haz clic en el mapa para añadir una anotación.",
      })
    }
  }, [isAddingAnnotation, isMeasuringDistance])

  // Toggle track markers
  const toggleTrackMarkers = useCallback(() => {
    setShowTrackMarkers(!showTrackMarkers)

    toast({
      title: showTrackMarkers ? "Marcadores de tiempo ocultos" : "Marcadores de tiempo visibles",
      description: showTrackMarkers
        ? "Se han ocultado los marcadores de tiempo en los tracks."
        : "Se muestran los marcadores de tiempo en los tracks.",
    })
  }, [showTrackMarkers])

  // Add this function to toggle fog of war
  const toggleFogOfWar = useCallback(() => {
    setFogOfWarEnabled((prev) => !prev)

    // Show toast
    toast({
      title: fogOfWarEnabled ? "Niebla de Guerra desactivada" : "Niebla de Guerra activada",
      description: fogOfWarEnabled
        ? "Todas las unidades son visibles en el mapa."
        : `Solo se muestran las unidades de la facción ${fogOfWarFaction}.`,
    })
  }, [fogOfWarEnabled, fogOfWarFaction])

  // Handle map click
  const handleMapClick = useCallback(
    (latlng: [number, number], waypointUnitId: string | null = null) => {
      // Si estamos en modo de añadir anotación
      if (isAddingAnnotation) {
        setClickPosition(latlng)
        setCurrentAnnotation({
          position: latlng,
          title: "",
          text: "",
          color: "#3b82f6", // Default blue color
        })
        setIsAnnotationDialogOpen(true)
        return
      }

      // Si estamos en modo de medición, añadir punto
      if (isMeasuringDistance) {
        setMeasurePoints((prev) => {
          // Si ya hay dos puntos, reiniciar
          if (prev.length >= 2) {
            return [latlng]
          }
          return [...prev, latlng]
        })
        return
      }

      if (isAddingWaypoint && unitIdForWaypoint) {
        // Add waypoint to the unit
        setUnits((prevUnits) => {
          const updatedUnits = prevUnits.map((unit) => {
            if (unit.id === unitIdForWaypoint) {
              // Create a new waypoint
              const newWaypoint: Waypoint = {
                id: `waypoint-${Date.now()}`,
                position: latlng,
                name: `Waypoint ${(unit.waypoints?.length || 0) + 1}`,
                speed: unit.speed,
                completed: false,
              }

              // Add waypoint to unit and automatically enable following waypoints
              return {
                ...unit,
                waypoints: [...(unit.waypoints || []), newWaypoint],
                followingWaypoints: true, // Automatically enable following waypoints
              }
            }
            return unit
          })

          // Add to history
          addToHistory(updatedUnits)

          return updatedUnits
        })

        // Reset adding waypoint state
        setIsAddingWaypoint(false)
        setUnitIdForWaypoint(null)

        // Show toast
        toast({
          title: "Waypoint añadido",
          description: "El waypoint ha sido añadido y la unidad lo seguirá automáticamente.",
        })

        // Open waypoints dialog again
        const unit = units.find((u) => u.id === unitIdForWaypoint)
        if (unit) {
          setTimeout(() => {
            setUnitForWaypoints(unit)
            setIsWaypointsDialogOpen(true)
          }, 100)
        }
      } else if (isMovingUnit && unitToMove) {
        // Move the unit to the new position
        setUnits((prevUnits) => {
          const updatedUnits = prevUnits.map((unit) => {
            if (unit.id === unitToMove) {
              // Create a new track history entry
              const newTrackEntry: Position = {
                coords: latlng,
                timestamp: Date.now(),
                turn: turnState.currentTurn,
              }

              return {
                ...unit,
                position: latlng,
                trackHistory: [...unit.trackHistory, newTrackEntry],
              }
            }
            return unit
          })

          // Add to history
          addToHistory(updatedUnits)

          return updatedUnits
        })

        // Reset moving state
        setIsMovingUnit(false)
        setUnitToMove(null)

        // Show toast
        toast({
          title: "Unidad movida",
          description: "La unidad ha sido reposicionada correctamente.",
        })
      } else if (activeUnit) {
        // Normal click for placing units
        setClickPosition(latlng)
      }
    },
    [
      isMeasuringDistance,
      isMovingUnit,
      unitToMove,
      turnState.currentTurn,
      activeUnit,
      isAddingWaypoint,
      unitIdForWaypoint,
      units,
      addToHistory,
      isAddingAnnotation,
    ],
  )

  // Handle unit form submission
  const handleUnitFormSubmit = useCallback(
    (unitData) => {
      if (!clickPosition || !activeUnit) return

      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        type: activeUnit,
        subtype: unitData.subtype,
        color: activeColor,
        position: clickPosition,
        trackHistory: [
          {
            coords: clickPosition,
            timestamp: Date.now(),
            turn: turnState.currentTurn,
          },
        ],
        waypoints: [],
        followingWaypoints: false,
        detected: false, // Por defecto, las unidades NO están detectadas
        ...unitData,
      }

      setUnits((prevUnits) => {
        const updatedUnits = [...prevUnits, newUnit]
        // Add to history
        addToHistory(updatedUnits)
        return updatedUnits
      })

      setClickPosition(null) // Reset click position after adding unit
      setActiveUnit(null) // Reset active unit to close the form
      setActiveSubtype(null) // Reset active subtype

      // Show toast
      toast({
        title: "Unidad añadida",
        description: `${newUnit.name} ha sido añadido al mapa.`,
      })
    },
    [clickPosition, activeUnit, activeColor, turnState.currentTurn, addToHistory],
  )

  // Handle annotation submission
  const handleAnnotationSubmit = useCallback(() => {
    if (!currentAnnotation || !currentAnnotation.position) return

    if (editingAnnotationId) {
      // Update existing annotation
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === editingAnnotationId ? ({ ...currentAnnotation, id: editingAnnotationId } as Annotation) : ann,
        ),
      )

      toast({
        title: "Anotación actualizada",
        description: "La anotación ha sido actualizada correctamente.",
      })
    } else {
      // Add new annotation
      const newAnnotation: Annotation = {
        id: `annotation-${Date.now()}`,
        position: currentAnnotation.position as [number, number],
        title: currentAnnotation.title || "Sin título",
        text: currentAnnotation.text || "",
        color: currentAnnotation.color || "#3b82f6",
      }

      setAnnotations((prev) => [...prev, newAnnotation])

      toast({
        title: "Anotación añadida",
        description: "La anotación ha sido añadida al mapa.",
      })
    }

    // Reset states
    setIsAnnotationDialogOpen(false)
    setCurrentAnnotation(null)
    setEditingAnnotationId(null)
    setIsAddingAnnotation(false)
  }, [currentAnnotation, editingAnnotationId])

  // Handle editing annotation
  const handleEditAnnotation = useCallback(
    (annotationId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId)
      if (annotation) {
        setCurrentAnnotation(annotation)
        setEditingAnnotationId(annotationId)
        setIsAnnotationDialogOpen(true)
      }
    },
    [annotations],
  )

  // Handle deleting annotation
  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))

    toast({
      title: "Anotación eliminada",
      description: "La anotación ha sido eliminada del mapa.",
    })
  }, [])

  const handlePositionChange = useCallback((latlng: [number, number]) => {
    setPosition(latlng)
  }, [])

  const toggleLayer = useCallback((layer: string) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }))
  }, [])

  // Handle measurement unit change
  const handleMeasurementUnitChange = useCallback((unit: string) => {
    setMeasurementUnit(unit)
  }, [])

  // Handle turn state changes
  const handleTurnChange = useCallback((newTurnState: Partial<TurnState>) => {
    setTurnState((prev) => ({
      ...prev,
      ...newTurnState,
    }))
  }, [])

  // Handle scenario info changes
  const handleScenarioChange = useCallback((newInfo: Partial<ScenarioInfo>) => {
    setScenarioInfo((prev) => ({
      ...prev,
      ...newInfo,
    }))
  }, [])

  // Process waypoints for a unit - FIXED VERSION
  const processWaypoints = useCallback((unit: Unit, timeInMinutes: number): Unit => {
    // Si no hay waypoints o no está siguiendo waypoints, devolver la unidad sin cambios
    if (!unit.waypoints?.length || !unit.followingWaypoints) {
      return unit
    }

    // Encontrar el primer waypoint no completado
    const nextWaypointIndex = unit.waypoints.findIndex((wp) => !wp.completed)

    // Si todos los waypoints están completados, dejar de seguir
    if (nextWaypointIndex === -1) {
      return {
        ...unit,
        followingWaypoints: false,
      }
    }

    const nextWaypoint = unit.waypoints[nextWaypointIndex]

    // Calcular rumbo hacia el waypoint
    const headingToWaypoint = calculateHeading(unit.position, nextWaypoint.position)

    // Calcular distancia al waypoint en millas náuticas
    const distanceToWaypoint = calculateDistance(unit.position, nextWaypoint.position)

    // Usar la velocidad del waypoint si está disponible, de lo contrario usar la velocidad de la unidad
    const speed = nextWaypoint.speed || unit.speed

    // Calcular la distancia que se puede recorrer en este período de tiempo (en millas náuticas)
    const distanceTraveledInNM = (speed * timeInMinutes) / 60 // Convertir a horas

    // Comprobar si podemos alcanzar el waypoint en este período de tiempo
    if (distanceTraveledInNM >= distanceToWaypoint) {
      // Podemos alcanzar el waypoint - marcarlo como completado
      const updatedWaypoints = unit.waypoints.map((wp, idx) =>
        idx === nextWaypointIndex ? { ...wp, completed: true } : wp,
      )

      // Devolver la unidad actualizada con la nueva posición en el waypoint
      return {
        ...unit,
        position: nextWaypoint.position,
        heading: headingToWaypoint,
        speed,
        waypoints: updatedWaypoints,
      }
    } else {
      // No podemos alcanzar el waypoint - movernos hacia él
      const newPosition = calculateNewPosition(unit.position, headingToWaypoint, speed, timeInMinutes)

      // Devolver la unidad actualizada con la nueva posición
      return {
        ...unit,
        position: newPosition,
        heading: headingToWaypoint,
        speed,
      }
    }
  }, [])

  // Advance units based on their heading and speed
  const advanceUnits = useCallback(() => {
    setUnits((prevUnits) => {
      const updatedUnits = prevUnits.map((unit) => {
        // Skip installations or units with no speed
        if (unit.type === "installation" || unit.speed === 0) {
          return unit
        }

        // Calculate time in minutes based on turn type
        const timeInMinutes = turnState.turnType === "tactical" ? 30 : 3

        // Create a new track history entry (will be updated with the final position)
        const newTrackEntry: Position = {
          coords: unit.position, // Placeholder, will be updated
          timestamp: Date.now(),
          turn: turnState.currentTurn + 1,
        }

        // Check if unit is following waypoints
        if (unit.followingWaypoints && unit.waypoints && unit.waypoints.length > 0) {
          // Process waypoints
          const updatedUnit = processWaypoints(unit, timeInMinutes)

          // Update track history with the new position
          newTrackEntry.coords = updatedUnit.position

          return {
            ...updatedUnit,
            trackHistory: [...updatedUnit.trackHistory, newTrackEntry],
          }
        }

        // Check if there's a planned movement for this turn
        let heading = unit.heading
        let speed = unit.speed

        if (unit.plannedMovement && unit.plannedMovement.turn === turnState.currentTurn + 1) {
          heading = unit.plannedMovement.heading
          speed = unit.plannedMovement.speed
        }

        // Calculate new position
        const newPosition = calculateNewPosition(unit.position, heading, speed, timeInMinutes)

        // Update track history with the new position
        newTrackEntry.coords = newPosition

        // Return updated unit with applied planned movement
        return {
          ...unit,
          position: newPosition,
          heading: heading,
          speed: speed,
          trackHistory: [...unit.trackHistory, newTrackEntry],
          plannedMovement: undefined, // Eliminar el movimiento planificado ya que se ha aplicado
        }
      })

      // Add to history
      addToHistory(updatedUnits)

      return updatedUnits
    })
  }, [turnState.turnType, turnState.currentTurn, addToHistory, processWaypoints])

  // Revert units to previous positions
  const revertUnits = useCallback(() => {
    // Check if we can go back in history
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setUnits(unitsHistory[newIndex])
    } else {
      // Show toast if we can't go back
      toast({
        title: "No hay turnos anteriores",
        description: "No es posible retroceder más en el historial.",
        variant: "destructive",
      })
    }
  }, [historyIndex, unitsHistory])

  // Toggle simulation mode
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev)
  }, [])

  // Toggle real-time mode
  const toggleRealTime = useCallback(() => {
    // Si estamos activando el tiempo real, desactivar la simulación
    if (!isRealTime && isSimulating) {
      setIsSimulating(false)
    }
    setIsRealTime((prev) => !prev)
    setRealTimeProgress(0)
    setLastRealTimeUpdate(Date.now())
  }, [isRealTime, isSimulating])

  // Añadir función para actualizar el offset de etiquetas
  const handleUpdateLabelOffset = useCallback((unitId, newOffset) => {
    setLabelOffsets((prev) => ({
      ...prev,
      [unitId]: newOffset,
    }))
  }, [])

  // Run simulation
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      advanceUnits()

      // Calcular nueva hora basada en el tipo de turno
      const minutesToAdd = turnState.turnType === "tactical" ? 30 : 3
      const newTime = new Date(turnState.currentTime)
      newTime.setMinutes(newTime.getMinutes() + minutesToAdd)

      setTurnState((prev) => ({
        ...prev,
        currentTurn: prev.currentTurn + 1,
        currentTime: newTime,
      }))
    }, 2000) // Advance every 2 seconds in simulation mode

    return () => clearInterval(interval)
  }, [isSimulating, advanceUnits, turnState.turnType, turnState.currentTime])

  // Modificar la función que maneja el movimiento en tiempo real para usar el multiplicador de velocidad
  useEffect(() => {
    if (!isRealTime) return

    // Determinar la duración del turno en milisegundos
    // Para tiempo real: 1 minuto de juego = 60 segundos de tiempo real (1x)
    // Ajustado por el multiplicador de velocidad
    const turnDurationInMs =
      turnState.turnType === "tactical"
        ? (30 * 60 * 1000) / speedMultiplier // 30 minutos = 30 minutos en tiempo real (1x)
        : (3 * 60 * 1000) / speedMultiplier // 3 minutos = 3 minutos en tiempo real (1x)

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastRealTimeUpdate
      const progressPercent = (elapsed / turnDurationInMs) * 100

      // Actualizar el progreso
      setRealTimeProgress(Math.min(progressPercent, 100))

      // Mover gradualmente las unidades en tiempo real
      setUnits((prevUnits) => {
        return prevUnits.map((unit) => {
          // Skip installations or units with no speed
          if (unit.type === "installation" || unit.speed === 0) {
            return unit
          }

          // Calculate time in minutes based on turn type and elapsed time
          const totalTimeInMinutes = turnState.turnType === "tactical" ? 30 : 3
          const elapsedTimeInMinutes = (totalTimeInMinutes * elapsed) / turnDurationInMs

          // Si la unidad está siguiendo waypoints
          if (unit.followingWaypoints && unit.waypoints && unit.waypoints.length > 0) {
            // Process waypoints with partial time
            const updatedUnit = processWaypoints(unit, elapsedTimeInMinutes)
            return {
              ...updatedUnit,
              labelOffset: labelOffsets[unit.id] || unit.labelOffset, // Mantener el offset de la etiqueta
            }
          }

          // Check if there's a planned movement for this turn
          let heading = unit.heading
          let speed = unit.speed

          if (unit.plannedMovement && unit.plannedMovement.turn === turnState.currentTurn + 1) {
            heading = unit.plannedMovement.heading
            speed = unit.plannedMovement.speed
          }

          // Calculate new position based on elapsed time
          const newPosition = calculateNewPosition(unit.position, heading, speed, elapsedTimeInMinutes)

          return {
            ...unit,
            position: newPosition,
            labelOffset: labelOffsets[unit.id] || unit.labelOffset, // Mantener el offset de la etiqueta
          }
        })
      })

      // Si hemos alcanzado el 100%, avanzar al siguiente turno
      if (progressPercent >= 100) {
        // Avanzar al siguiente turno
        advanceUnits()

        // Calcular nueva hora basada en el tipo de turno
        const minutesToAdd = turnState.turnType === "tactical" ? 30 : 3
        const newTime = new Date(turnState.currentTime)
        newTime.setMinutes(newTime.getMinutes() + minutesToAdd)

        setTurnState((prev) => ({
          ...prev,
          currentTurn: prev.currentTurn + 1,
          currentTime: newTime,
        }))

        // Reiniciar el progreso y el tiempo de actualización
        setRealTimeProgress(0)
        setLastRealTimeUpdate(now)
      }
    }, 100) // Actualizar cada 100ms para un movimiento fluido

    return () => clearInterval(interval)
  }, [
    isRealTime,
    turnState.turnType,
    turnState.currentTime,
    lastRealTimeUpdate,
    advanceUnits,
    processWaypoints,
    speedMultiplier,
    labelOffsets,
  ])

  // Añadir función para cambiar el multiplicador de velocidad
  const changeSpeedMultiplier = useCallback((multiplier) => {
    setSpeedMultiplier(multiplier)
    setLastRealTimeUpdate(Date.now()) // Reiniciar el tiempo de actualización para evitar saltos

    // Mostrar toast con la nueva velocidad
    toast({
      title: `Velocidad: ${multiplier}x`,
      description: `La simulación ahora se ejecuta a ${multiplier} veces la velocidad normal.`,
    })
  }, [])

  // Handle centering on a unit
  const handleCenterUnit = useCallback((unit: Unit) => {
    setUnitToCenter(unit)

    // Reset after a short delay to allow for future centering on the same unit
    setTimeout(() => {
      setUnitToCenter(null)
    }, 100)
  }, [])

  // Handle deleting a unit
  const handleDeleteUnit = useCallback((unitId: string) => {
    setUnitToDelete(unitId)
    setIsDeleteDialogOpen(true)
  }, [])

  // Confirm unit deletion
  const confirmDeleteUnit = useCallback(() => {
    if (!unitToDelete) return

    setUnits((prevUnits) => {
      const updatedUnits = prevUnits.filter((unit) => unit.id !== unitToDelete)
      // Add to history
      addToHistory(updatedUnits)
      return updatedUnits
    })

    setUnitToDelete(null)
    setIsDeleteDialogOpen(false)

    // Show toast
    toast({
      title: "Unidad eliminada",
      description: "La unidad ha sido eliminada correctamente.",
    })
  }, [unitToDelete, addToHistory])

  // Handle moving a unit
  const handleMoveUnit = useCallback(
    (unitId: string) => {
      setUnitToMove(unitId)
      setIsMovingUnit(true)

      // Find and center on the unit
      const unit = units.find((u) => u.id === unitId)
      if (unit) {
        setUnitToCenter(unit)
      }

      // Show toast
      toast({
        title: "Modo de movimiento activado",
        description: "Haz clic en el mapa para mover la unidad a la nueva posición.",
      })
    },
    [units],
  )

  // Handle editing a unit
  const handleEditUnit = useCallback(
    (unitId: string) => {
      const unit = units.find((u) => u.id === unitId)
      if (unit) {
        setUnitToEdit(unit)
        setIsEditDialogOpen(true)
      }
    },
    [units],
  )

  // Handle planning movement for a unit
  const handlePlanMovement = useCallback(
    (unitId: string) => {
      const unit = units.find((u) => u.id === unitId)
      if (unit) {
        setUnitToPlan(unit)
        setIsPlanMovementDialogOpen(true)
      }
    },
    [units],
  )

  // Handle managing waypoints for a unit
  const handleManageWaypoints = useCallback(
    (unitId: string) => {
      const unit = units.find((u) => u.id === unitId)
      if (unit) {
        setUnitForWaypoints(unit)
        setIsWaypointsDialogOpen(true)
      }
    },
    [units],
  )

  // Handle adding a waypoint
  const handleAddWaypoint = useCallback(
    (unitId: string) => {
      setIsAddingWaypoint(true)
      setUnitIdForWaypoint(unitId)

      // Find and center on the unit
      const unit = units.find((u) => u.id === unitId)
      if (unit) {
        setUnitToCenter(unit)
      }

      // Show toast
      toast({
        title: "Modo de añadir waypoint activado",
        description: "Haz clic en el mapa para añadir un waypoint.",
      })
    },
    [units],
  )

  // Save waypoints
  const saveWaypoints = useCallback(
    (unitId: string, waypoints: Waypoint[], followWaypoints: boolean) => {
      setUnits((prevUnits) => {
        const updatedUnits = prevUnits.map((unit) => {
          if (unit.id === unitId) {
            return {
              ...unit,
              waypoints,
              followingWaypoints: followWaypoints,
            }
          }
          return unit
        })

        // Add to history
        addToHistory(updatedUnits)

        return updatedUnits
      })

      // Show toast
      toast({
        title: "Waypoints actualizados",
        description: `Se han guardado ${waypoints.length} waypoints.`,
      })
    },
    [addToHistory],
  )

  // Save planned movement
  const savePlannedMovement = useCallback(
    (unitId: string, plannedMovement: { heading: number; speed: number }) => {
      setUnits((prevUnits) => {
        const updatedUnits = prevUnits.map((unit) => {
          if (unit.id === unitId) {
            return {
              ...unit,
              plannedMovement: {
                ...plannedMovement,
                turn: turnState.currentTurn + 1, // Planificar para el siguiente turno
              },
            }
          }
          return unit
        })

        // Add to history
        addToHistory(updatedUnits)

        return updatedUnits
      })

      // Show toast
      toast({
        title: "Movimiento planificado",
        description: `Se ha planificado el movimiento para el turno ${turnState.currentTurn + 1}.`,
      })
    },
    [turnState.currentTurn, addToHistory],
  )

  // Modificar la función saveEditedUnit para guardar también el offset de la etiqueta
  const saveEditedUnit = useCallback(
    (unitId, updatedData) => {
      setUnits((prevUnits) => {
        const updatedUnits = prevUnits.map((unit) => {
          if (unit.id === unitId) {
            return {
              ...unit,
              ...updatedData,
              labelOffset: labelOffsets[unitId] || unit.labelOffset, // Mantener el offset de la etiqueta
            }
          }
          return unit
        })

        // Add to history
        addToHistory(updatedUnits)

        return updatedUnits
      })

      // Show toast
      toast({
        title: "Unidad actualizada",
        description: "Los cambios han sido guardados correctamente.",
      })
    },
    [addToHistory, labelOffsets],
  )

  // Save current scenario to localStorage
  const saveScenario = useCallback(
    (scenarioName: string) => {
      const newScenario: SavedScenario = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        date: new Date().toISOString(),
        scenarioInfo,
        turnState,
        units,
        annotations,
      }

      // Add to saved scenarios
      const updatedScenarios = [...savedScenarios, newScenario]
      setSavedScenarios(updatedScenarios)

      // Save to localStorage
      try {
        localStorage.setItem("savedScenarios", JSON.stringify(updatedScenarios))
      } catch (error) {
        console.error("Error saving scenario:", error)
      }

      // Show toast
      toast({
        title: "Escenario guardado",
        description: `El escenario "${scenarioName}" ha sido guardado correctamente.`,
      })

      // Close dialog
      setIsSaveDialogOpen(false)
    },
    [scenarioInfo, turnState, units, annotations, savedScenarios],
  )

  // Export scenario to file
  const exportScenario = useCallback(
    (scenarioName: string) => {
      const scenarioData = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        date: new Date().toISOString(),
        scenarioInfo,
        turnState,
        units,
        annotations,
        version: "1.0", // Versión del formato de archivo
      }

      // Convertir a JSON
      const jsonData = JSON.stringify(scenarioData, null, 2)

      // Crear un blob y descargar
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Crear un enlace de descarga y hacer clic en él
      const a = document.createElement("a")
      a.href = url
      a.download = `${scenarioName.replace(/\s+/g, "_")}.json`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      // Show toast
      toast({
        title: "Escenario exportado",
        description: `El escenario "${scenarioName}" ha sido exportado como archivo.`,
      })

      // Close dialog
      setIsSaveDialogOpen(false)
    },
    [scenarioInfo, turnState, units, annotations],
  )

  // Import scenario from file
  const importScenario = useCallback((fileData: any) => {
    try {
      // Validar y cargar datos
      if (!fileData.scenarioInfo || !fileData.turnState || !fileData.units) {
        throw new Error("Formato de archivo inválido")
      }

      // Cargar datos del escenario
      setScenarioInfo(fileData.scenarioInfo)

      // Convertir strings de fecha a objetos Date
      const loadedTurnState = {
        ...fileData.turnState,
        currentTime: new Date(fileData.turnState.currentTime),
      }
      setTurnState(loadedTurnState)

      // Cargar unidades
      setUnits(fileData.units)

      // Cargar anotaciones si existen
      if (fileData.annotations) {
        setAnnotations(fileData.annotations)
      }

      // Reiniciar historial
      setUnitsHistory([fileData.units])
      setHistoryIndex(0)

      // Mostrar toast
      toast({
        title: "Escenario importado",
        description: `El escenario "${fileData.name}" ha sido importado correctamente.`,
      })
    } catch (error) {
      console.error("Error importing scenario:", error)
      toast({
        title: "Error al importar",
        description: "El archivo no contiene un escenario válido.",
        variant: "destructive",
      })
    }
  }, [])

  // Load scenario from localStorage
  const loadScenario = useCallback(
    (scenarioId: string) => {
      const scenario = savedScenarios.find((s) => s.id === scenarioId)
      if (!scenario) return

      // Load scenario data
      setScenarioInfo(scenario.scenarioInfo)

      // Convert date strings back to Date objects
      const loadedTurnState = {
        ...scenario.turnState,
        currentTime: new Date(scenario.turnState.currentTime),
      }
      setTurnState(loadedTurnState)

      // Load units
      setUnits(scenario.units)

      // Load annotations if they exist
      if (scenario.annotations) {
        setAnnotations(scenario.annotations)
      } else {
        setAnnotations([])
      }

      // Reset history
      setUnitsHistory([scenario.units])
      setHistoryIndex(0)

      // Show toast
      toast({
        title: "Escenario cargado",
        description: `El escenario "${scenario.name}" ha sido cargado correctamente.`,
      })

      // Close dialog
      setIsLoadDialogOpen(false)
    },
    [savedScenarios],
  )

  // Delete saved scenario
  const deleteScenario = useCallback(
    (scenarioId: string) => {
      const updatedScenarios = savedScenarios.filter((s) => s.id !== scenarioId)
      setSavedScenarios(updatedScenarios)

      // Save to localStorage
      try {
        localStorage.setItem("savedScenarios", JSON.stringify(updatedScenarios))
      } catch (error) {
        console.error("Error deleting scenario:", error)
      }

      // Show toast
      toast({
        title: "Escenario eliminado",
        description: "El escenario ha sido eliminado correctamente.",
      })
    },
    [savedScenarios],
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex flex-col h-full">
        {/* Update the header section to include the TopSidebar component */}
        <header className="bg-slate-800 dark:bg-slate-950 text-white p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Topográfico Mapa Interactivo
            </h1>
            <span className="ml-2 text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">v1.0</span>
          </div>
          <TopSidebar
            isMeasuringDistance={isMeasuringDistance}
            toggleMeasuringMode={toggleMeasuringMode}
            isAddingAnnotation={isAddingAnnotation}
            toggleAnnotationMode={toggleAnnotationMode}
            showTrackMarkers={showTrackMarkers}
            toggleTrackMarkers={toggleTrackMarkers}
            fogOfWarEnabled={fogOfWarEnabled}
            toggleFogOfWar={toggleFogOfWar}
          />
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 bg-slate-100 dark:bg-slate-900 p-4 overflow-y-auto border-r border-gray-700">
            <ScenarioForm
              scenarioInfo={scenarioInfo}
              onScenarioChange={handleScenarioChange}
              onOpenSaveDialog={() => setIsSaveDialogOpen(true)}
              onOpenLoadDialog={() => setIsLoadDialogOpen(true)}
            />

            <div className="h-4"></div>

            <LayerControls visibleLayers={visibleLayers} toggleLayer={toggleLayer} />

            <div className="h-4"></div>

            <UnitControls
              activeUnit={activeUnit}
              setActiveUnit={setActiveUnit}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              activeSubtype={activeSubtype}
              setActiveSubtype={setActiveSubtype}
            />

            {isMeasuringDistance && (
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded text-sm">
                <p className="font-medium">Modo de medición activado</p>
                <p className="text-xs mt-1">Haz clic en el mapa para marcar puntos y medir distancias.</p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs mr-2">Unidad:</span>
                  <select
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                  >
                    <option value="nm">Millas Náuticas</option>
                    <option value="m">Metros</option>
                    <option value="yd">Yardas</option>
                  </select>
                </div>
                {measurePoints.length === 2 && (
                  <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded">
                    <p className="font-medium">Distancia:</p>
                    <p className="text-lg font-bold">
                      {(() => {
                        const distanceInNM = calculateDistance(measurePoints[0], measurePoints[1])
                        switch (measurementUnit) {
                          case "nm":
                            return `${distanceInNM.toFixed(2)} millas náuticas`
                          case "m":
                            return `${Math.round(distanceInNM * 1852)} metros`
                          case "yd":
                            return `${Math.round(distanceInNM * 1852 * 1.09361)} yardas`
                          default:
                            return `${distanceInNM.toFixed(2)} millas náuticas`
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isAddingAnnotation && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 rounded text-sm">
                <p className="font-medium">Modo de anotación activado</p>
                <p className="text-xs mt-1">Haz clic en el mapa para añadir una anotación.</p>
              </div>
            )}

            {/* After the track markers toggle */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Marcadores de tiempo</h3>
                <Switch checked={showTrackMarkers} onCheckedChange={setShowTrackMarkers} id="track-markers-switch" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Muestra u oculta los marcadores de tiempo en los tracks de las unidades.
              </p>
            </div>

            {/* Add Fog of War controls */}
            <FogOfWarControls
              enabled={fogOfWarEnabled}
              setEnabled={setFogOfWarEnabled}
              visibleFaction={fogOfWarFaction}
              setVisibleFaction={setFogOfWarFaction}
            />

            {clickPosition && activeUnit && (
              <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 rounded text-sm">
                <p>
                  Posición seleccionada: {clickPosition[0].toFixed(4)}, {clickPosition[1].toFixed(4)}
                </p>
                <p className="text-xs mt-1">Complete los detalles de la unidad a continuación</p>
              </div>
            )}

            {isMovingUnit && (
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded text-sm">
                <p>Modo de movimiento activado</p>
                <p className="text-xs mt-1">Haz clic en el mapa para colocar la unidad en la nueva posición</p>
              </div>
            )}

            {isAddingWaypoint && (
              <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 rounded text-sm">
                <p>Modo de añadir waypoint activado</p>
                <p className="text-xs mt-1">Haz clic en el mapa para añadir un waypoint</p>
              </div>
            )}

            {activeUnit && clickPosition && (
              <UnitForm
                activeUnit={activeUnit}
                activeColor={activeColor}
                activeSubtype={activeSubtype}
                onSubmit={handleUnitFormSubmit}
              />
            )}

            <TurnManager
              turnState={turnState}
              onTurnChange={handleTurnChange}
              onAdvanceUnits={advanceUnits}
              onRevertUnits={revertUnits}
              isSimulating={isSimulating}
              onToggleSimulation={toggleSimulation}
              isRealTime={isRealTime}
              onToggleRealTime={toggleRealTime}
              speedMultiplier={speedMultiplier}
              onChangeSpeedMultiplier={changeSpeedMultiplier}
            />

            {/* Unidades en el mapa */}
            {units.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">Unidades en el Mapa ({units.length})</h2>
                <UnitList
                  units={units}
                  onCenterUnit={handleCenterUnit}
                  onDeleteUnit={handleDeleteUnit}
                  onMoveUnit={handleMoveUnit}
                  onEditUnit={handleEditUnit}
                  onPlanMovement={handlePlanMovement}
                  onManageWaypoints={handleManageWaypoints}
                  currentTurn={turnState.currentTurn}
                />
              </div>
            )}

            {/* Anotaciones en el mapa */}
            {annotations.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">Anotaciones ({annotations.length})</h2>
                <div className="space-y-2">
                  {annotations.map((annotation) => (
                    <div key={annotation.id} className="p-2 bg-white dark:bg-slate-800 rounded shadow">
                      <h3 className="font-medium">{annotation.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{annotation.text}</p>
                      <div className="flex justify-between mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Find and center on the annotation
                            setUnitToCenter({ position: annotation.position } as any)
                          }}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Centrar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditAnnotation(annotation.id)}>
                          <PenTool className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Update the MapWithNoSSR component to pass the fog of war props */}
          <div className="flex-1 relative">
            <MapWithNoSSR
              onMapClick={handleMapClick}
              onPositionChange={handlePositionChange}
              units={units.map((unit) => ({
                ...unit,
                labelOffset: labelOffsets[unit.id] || unit.labelOffset,
              }))}
              visibleLayers={visibleLayers}
              scenarioInfo={{
                ...scenarioInfo,
                currentTime: turnState.currentTime,
                turnType: turnState.turnType,
                currentTurn: turnState.currentTurn,
              }}
              unitToCenter={unitToCenter}
              isMovingUnit={isMovingUnit}
              isAddingWaypoint={isAddingWaypoint}
              unitIdForWaypoint={unitIdForWaypoint}
              onEditUnit={handleEditUnit}
              onMoveUnit={handleMoveUnit}
              onPlanMovement={handlePlanMovement}
              onManageWaypoints={handleManageWaypoints}
              onDeleteUnit={handleDeleteUnit}
              isMeasuringDistance={isMeasuringDistance}
              measurePoints={measurePoints}
              onUpdateLabelOffset={handleUpdateLabelOffset}
              measurementUnit={measurementUnit}
              onChangeMeasurementUnit={handleMeasurementUnitChange}
              annotations={annotations}
              isAddingAnnotation={isAddingAnnotation}
              onEditAnnotation={handleEditAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
              showTrackMarkers={showTrackMarkers}
              fogOfWarEnabled={fogOfWarEnabled}
              fogOfWarFaction={fogOfWarFaction}
            />
            {position && <CoordinateDisplay position={position} />}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La unidad será eliminada permanentemente del mapa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUnit} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit unit dialog */}
        <EditUnitDialog
          unit={unitToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setUnitToEdit(null)
          }}
          onSave={saveEditedUnit}
        />

        {/* Plan movement dialog */}
        <PlanMovementDialog
          unit={unitToPlan}
          isOpen={isPlanMovementDialogOpen}
          onClose={() => {
            setIsPlanMovementDialogOpen(false)
            setUnitToPlan(null)
          }}
          onSave={savePlannedMovement}
        />

        {/* Waypoints dialog */}
        <WaypointsDialog
          unit={unitForWaypoints}
          isOpen={isWaypointsDialogOpen}
          onClose={() => {
            setIsWaypointsDialogOpen(false)
            setUnitForWaypoints(null)
          }}
          onSave={saveWaypoints}
          onAddWaypoint={handleAddWaypoint}
        />

        {/* Save scenario dialog */}
        <SaveScenarioDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          onSave={saveScenario}
          onExport={exportScenario}
          currentName={scenarioInfo.name}
        />

        {/* Load scenario dialog */}
        <LoadScenarioDialog
          isOpen={isLoadDialogOpen}
          onClose={() => setIsLoadDialogOpen(false)}
          scenarios={savedScenarios}
          onLoad={loadScenario}
          onDelete={deleteScenario}
          onImport={importScenario}
        />

        {/* Annotation dialog */}
        <Dialog open={isAnnotationDialogOpen} onOpenChange={setIsAnnotationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAnnotationId ? "Editar anotación" : "Nueva anotación"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={currentAnnotation?.title || ""}
                  onChange={(e) => setCurrentAnnotation((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la anotación"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Texto</Label>
                <Textarea
                  id="text"
                  value={currentAnnotation?.text || ""}
                  onChange={(e) => setCurrentAnnotation((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Descripción o notas"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex space-x-2">
                  {["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"].map((color) => (
                    <div
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer ${currentAnnotation?.color === color ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentAnnotation((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnnotationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAnnotationSubmit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast notifications */}
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

