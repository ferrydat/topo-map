"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { TurnState } from "@/types/unit-types"
import { Play, Pause, SkipForward, SkipBack, Clock } from "lucide-react"

interface TurnManagerProps {
  turnState: TurnState
  onTurnChange: (newTurnState: Partial<TurnState>) => void
  onAdvanceUnits: () => void
  onRevertUnits: () => void
  isSimulating: boolean
  onToggleSimulation: () => void
  isRealTime: boolean
  onToggleRealTime: () => void
  speedMultiplier: number
  onChangeSpeedMultiplier: (multiplier: number) => void
}

export default function TurnManager({
  turnState,
  onTurnChange,
  onAdvanceUnits,
  onRevertUnits,
  isSimulating,
  onToggleSimulation,
  isRealTime,
  onToggleRealTime,
  speedMultiplier,
  onChangeSpeedMultiplier,
}: TurnManagerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Format scenario time as HH:MM
  const formatScenarioTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Update time remaining when turn type or real-time mode changes
  useEffect(() => {
    if (isRealTime) {
      // En modo tiempo real, el tiempo restante se actualiza dinámicamente
      const turnDuration = turnState.turnType === "tactical" ? 30 : 3 // en minutos
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) return 0
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // En modo normal, simplemente mostrar la duración total
      setTimeRemaining(
        turnState.turnType === "tactical" ? turnState.tacticalTurnDuration : turnState.intermediateTurnDuration,
      )
    }
  }, [turnState.turnType, turnState.tacticalTurnDuration, turnState.intermediateTurnDuration, isRealTime])

  // Handle turn type change
  const handleTurnTypeChange = (type: "tactical" | "intermediate") => {
    onTurnChange({
      turnType: type,
    })
  }

  // Handle next turn
  const handleNextTurn = () => {
    // Calculate new time based on turn type
    const minutesToAdd = turnState.turnType === "tactical" ? 30 : 3
    const newTime = new Date(turnState.currentTime)
    newTime.setMinutes(newTime.getMinutes() + minutesToAdd)

    onTurnChange({
      currentTurn: turnState.currentTurn + 1,
      currentTime: newTime,
    })
    onAdvanceUnits()
  }

  // Handle previous turn
  const handlePreviousTurn = () => {
    if (turnState.currentTurn > 1) {
      // Calculate new time based on turn type
      const minutesToSubtract = turnState.turnType === "tactical" ? 30 : 3
      const newTime = new Date(turnState.currentTime)
      newTime.setMinutes(newTime.getMinutes() - minutesToSubtract)

      onTurnChange({
        currentTurn: turnState.currentTurn - 1,
        currentTime: newTime,
      })
      onRevertUnits()
    }
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h2 className="text-lg font-semibold">Gestión de Turnos y Movimiento</h2>

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium">Turno actual:</span>
          <span className="ml-2 text-lg font-bold">{turnState.currentTurn}</span>
        </div>

        <div className="text-right flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium mr-1">Hora:</span>
          <span className="text-lg font-bold">{formatScenarioTime(turnState.currentTime)}</span>
        </div>
      </div>

      <RadioGroup
        value={turnState.turnType}
        onValueChange={(value) => handleTurnTypeChange(value as "tactical" | "intermediate")}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="tactical" id="tactical" />
          <Label htmlFor="tactical">Turno Táctico (30 min)</Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="intermediate" id="intermediate" />
          <Label htmlFor="intermediate">Turno Intermedio (3 min)</Label>
        </div>
      </RadioGroup>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={isSimulating ? "destructive" : "default"}
          className="flex items-center justify-center"
          onClick={onToggleSimulation}
        >
          {isSimulating ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Simular
            </>
          )}
        </Button>

        <Button
          className="flex items-center justify-center"
          variant="secondary"
          onClick={handlePreviousTurn}
          disabled={turnState.currentTurn <= 1}
        >
          <SkipBack className="h-4 w-4 mr-1" />
          Turno Atrás
        </Button>

        <Button className="flex items-center justify-center" onClick={handleNextTurn}>
          <SkipForward className="h-4 w-4 mr-1" />
          Turno Siguiente
        </Button>
      </div>

      <div className="mt-2">
        <Button
          variant={isRealTime ? "destructive" : "outline"}
          className="w-full flex items-center justify-center"
          onClick={onToggleRealTime}
        >
          {isRealTime ? (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Detener Tiempo Real ({formatTime(timeRemaining)})
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Iniciar Tiempo Real
            </>
          )}
        </Button>
      </div>

      {isRealTime && (
        <>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
            <div
              className="real-time-progress rounded-full h-1.5"
              style={{
                width: `${
                  (turnState.turnType === "tactical"
                    ? (30 * 60 - timeRemaining) / (30 * 60)
                    : (3 * 60 - timeRemaining) / (3 * 60)) * 100
                }%`,
              }}
            ></div>
          </div>

          {/* Controles de velocidad de simulación */}
          <div className="mt-2 grid grid-cols-4 gap-2">
            <Button
              size="sm"
              variant={speedMultiplier === 1 ? "default" : "outline"}
              onClick={() => onChangeSpeedMultiplier(1)}
              className="text-xs"
            >
              x1
            </Button>
            <Button
              size="sm"
              variant={speedMultiplier === 2 ? "default" : "outline"}
              onClick={() => onChangeSpeedMultiplier(2)}
              className="text-xs"
            >
              x2
            </Button>
            <Button
              size="sm"
              variant={speedMultiplier === 5 ? "default" : "outline"}
              onClick={() => onChangeSpeedMultiplier(5)}
              className="text-xs"
            >
              x5
            </Button>
            <Button
              size="sm"
              variant={speedMultiplier === 10 ? "default" : "outline"}
              onClick={() => onChangeSpeedMultiplier(10)}
              className="text-xs"
            >
              x10
            </Button>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Al avanzar al siguiente turno, las unidades se moverán según su rumbo y velocidad.</p>
        <p>El modo simulación mueve automáticamente las unidades en intervalos regulares.</p>
        <p>
          El modo tiempo real avanza el turno cuando transcurre el tiempo real equivalente (
          {turnState.turnType === "tactical" ? "30 min" : "3 min"}).
          {isRealTime && speedMultiplier > 1 && ` Velocidad actual: ${speedMultiplier}x.`}
        </p>
      </div>
    </div>
  )
}

