"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Unit } from "@/types/unit-types"
import { Compass } from "lucide-react"

interface PlanMovementDialogProps {
  unit: Unit | null
  isOpen: boolean
  onClose: () => void
  onSave: (unitId: string, plannedMovement: { heading: number; speed: number }) => void
}

export default function PlanMovementDialog({ unit, isOpen, onClose, onSave }: PlanMovementDialogProps) {
  const [heading, setHeading] = useState(0)
  const [speed, setSpeed] = useState(0)

  // Update form when unit changes
  useEffect(() => {
    if (unit) {
      setHeading(unit.heading)
      setSpeed(unit.speed)
    }
  }, [unit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!unit) return

    onSave(unit.id, { heading, speed })
    onClose()
  }

  if (!unit) return null

  const getMaxSpeed = () => {
    switch (unit.type) {
      case "aircraft":
        return 1000
      case "helicopter":
        return 300
      case "ship":
        return 50
      case "submarine":
        return 40
      default:
        return 50
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Planificar Movimiento</DialogTitle>
          <DialogDescription>Establece el rumbo y velocidad para {unit.name} en el próximo turno</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-32 h-32 mb-2">
                <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs">N</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-xs">S</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-xs">O</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-xs">E</div>

                {/* Heading indicator */}
                <div
                  className="absolute top-1/2 left-1/2 w-1 h-16 bg-primary origin-bottom"
                  style={{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }}
                ></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-center font-bold text-lg">{heading}°</div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="heading" className="text-right">
                Rumbo:
              </Label>
              <div className="col-span-3">
                <Slider
                  id="heading"
                  min={0}
                  max={359}
                  step={1}
                  value={[heading]}
                  onValueChange={(value) => setHeading(value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="speed" className="text-right">
                Velocidad: {speed} nudos
              </Label>
              <div className="col-span-3">
                <Slider
                  id="speed"
                  min={0}
                  max={getMaxSpeed()}
                  step={1}
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

