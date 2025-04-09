"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Move, Navigation, MapPin, Trash2, X, MoreHorizontal } from "lucide-react"
import type { Unit } from "@/types/unit-types"

interface UnitContextMenuProps {
  unit: Unit
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (unitId: string) => void
  onMove: (unitId: string) => void
  onPlanMovement: (unitId: string) => void
  onManageWaypoints: (unitId: string) => void
  onDelete: (unitId: string) => void
}

export default function UnitContextMenu({
  unit,
  position,
  onClose,
  onEdit,
  onMove,
  onPlanMovement,
  onManageWaypoints,
  onDelete,
}: UnitContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Adjust position to ensure menu stays within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - (expanded ? 300 : 50)),
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <Card className="p-2 shadow-lg border border-border w-52">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-sm truncate max-w-[160px]" title={unit.name}>
            {unit.name}
            {unit.followingWaypoints && unit.waypoints?.length > 0 && (
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">•</span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {expanded ? (
          <div className="space-y-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm h-8"
              onClick={() => {
                onEdit(unit.id)
                onClose()
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              <span>Editar unidad</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm h-8"
              onClick={() => {
                onMove(unit.id)
                onClose()
              }}
            >
              <Move className="h-4 w-4 mr-2" />
              <span>Mover unidad</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm h-8"
              onClick={() => {
                onPlanMovement(unit.id)
                onClose()
              }}
            >
              <Navigation className="h-4 w-4 mr-2" />
              <span>Planificar movimiento</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm h-8"
              onClick={() => {
                onManageWaypoints(unit.id)
                onClose()
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              <span>Gestionar waypoints</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm h-8 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(unit.id)
                onClose()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Eliminar unidad</span>
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setExpanded(true)}>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            <span>Opciones</span>
          </Button>
        )}
      </Card>
    </div>
  )
}

