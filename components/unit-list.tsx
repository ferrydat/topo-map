"use client"

import { Button } from "@/components/ui/button"
import type { Unit } from "@/types/unit-types"
import {
  Ship,
  Plane,
  ShipIcon as Submarine,
  BirdIcon as Helicopter,
  Building,
  Trash2,
  Move,
  Edit,
  Navigation,
  MapPin,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface UnitListProps {
  units: Unit[]
  onCenterUnit: (unit: Unit) => void
  onDeleteUnit: (unitId: string) => void
  onMoveUnit: (unitId: string) => void
  onEditUnit: (unitId: string) => void
  onPlanMovement: (unitId: string) => void
  onManageWaypoints: (unitId: string) => void
  currentTurn: number
}

export default function UnitList({
  units,
  onCenterUnit,
  onDeleteUnit,
  onMoveUnit,
  onEditUnit,
  onPlanMovement,
  onManageWaypoints,
  currentTurn,
}: UnitListProps) {
  // Get icon based on unit type
  const getUnitIcon = (type: string) => {
    switch (type) {
      case "ship":
        return <Ship className="h-4 w-4" />
      case "aircraft":
        return <Plane className="h-4 w-4" />
      case "submarine":
        return <Submarine className="h-4 w-4" />
      case "helicopter":
        return <Helicopter className="h-4 w-4" />
      case "installation":
        return <Building className="h-4 w-4" />
      default:
        return <Ship className="h-4 w-4" />
    }
  }

  // Get color class based on unit color
  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "border-red-500 bg-red-50 dark:bg-red-950 dark:bg-opacity-30"
      case "green":
        return "border-green-500 bg-green-50 dark:bg-green-950 dark:bg-opacity-30"
      case "blue":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:bg-opacity-30"
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-800"
    }
  }

  // Check if unit has planned movement for next turn
  const hasPlannedMovement = (unit: Unit) => {
    return unit.plannedMovement && unit.plannedMovement.turn === currentTurn + 1
  }

  // Check if unit has waypoints
  const hasWaypoints = (unit: Unit) => {
    return unit.waypoints && unit.waypoints.length > 0
  }

  if (units.length === 0) {
    return <div className="text-center p-4 text-sm text-muted-foreground">No hay unidades en el mapa</div>
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      {units.map((unit) => (
        <div
          key={unit.id}
          className={`p-2 rounded border-l-4 ${getColorClass(unit.color)} cursor-pointer hover:bg-opacity-80 transition-colors unit-list-item ${unit.color} ${unit.detected === false ? "opacity-70" : ""}`}
          onClick={() => onCenterUnit(unit)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getUnitIcon(unit.type)}
              <div>
                <p className="font-bold text-sm flex items-center">
                  {unit.name}
                  {unit.detected === false && (
                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                      (No detectado)
                    </span>
                  )}
                </p>
                <p className="text-xs">{unit.class}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onCenterUnit(unit)
                }}
                title="Centrar en el mapa"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="22" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="12" x2="2" y2="12" />
                </svg>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="6" r="1" />
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="18" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditUnit(unit.id)
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Editar Unidad</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveUnit(unit.id)
                    }}
                    className="cursor-pointer"
                  >
                    <Move className="h-4 w-4 mr-2" />
                    <span>Mover</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlanMovement(unit.id)
                    }}
                    className="cursor-pointer"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    <span>Planificar Movimiento</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onManageWaypoints(unit.id)
                    }}
                    className="cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Gestionar Waypoints</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteUnit(unit.id)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Eliminar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-1 text-xs grid grid-cols-2 gap-x-2">
            <p>Rumbo: {unit.heading}°</p>
            <p>Vel: {unit.speed} kn</p>
            {unit.altitude && <p>Alt: {unit.altitude} ft</p>}
            {unit.depth && <p>Prof: {unit.depth} m</p>}

            <div className="col-span-2 mt-1 flex flex-wrap gap-1">
              {hasPlannedMovement(unit) && (
                <Badge variant="outline" className="flex items-center gap-1 bg-primary/10">
                  <Navigation className="h-3 w-3" />
                  <span>
                    Plan: {unit.plannedMovement.heading}° @ {unit.plannedMovement.speed} kn
                  </span>
                </Badge>
              )}

              {hasWaypoints(unit) && (
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${unit.followingWaypoints ? "bg-green-100 dark:bg-green-900/30" : "bg-secondary/10"}`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>
                    Waypoints: {unit.waypoints.length}
                    {unit.followingWaypoints && (
                      <span className="ml-1 text-green-600 dark:text-green-400">(Siguiendo)</span>
                    )}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

