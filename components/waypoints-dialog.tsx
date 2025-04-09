"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Waypoint, Unit } from "@/types/unit-types"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WaypointsDialogProps {
  unit: Unit | null
  isOpen: boolean
  onClose: () => void
  onSave: (unitId: string, waypoints: Waypoint[], followWaypoints: boolean) => void
  onAddWaypoint: (unitId: string) => void
}

export default function WaypointsDialog({ unit, isOpen, onClose, onSave, onAddWaypoint }: WaypointsDialogProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [followWaypoints, setFollowWaypoints] = useState(false)
  const [editingWaypointId, setEditingWaypointId] = useState<string | null>(null)
  const [waypointName, setWaypointName] = useState("")
  const [waypointSpeed, setWaypointSpeed] = useState(0)

  // Update form when unit changes
  useEffect(() => {
    if (unit) {
      setWaypoints(unit.waypoints || [])
      setFollowWaypoints(unit.followingWaypoints || false)
    }
  }, [unit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!unit) return

    onSave(unit.id, waypoints, followWaypoints)
    onClose()
  }

  const handleAddWaypoint = () => {
    if (!unit) return
    onAddWaypoint(unit.id)
    onClose()
  }

  const handleDeleteWaypoint = (waypointId: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== waypointId))
  }

  const handleEditWaypoint = (waypoint: Waypoint) => {
    setEditingWaypointId(waypoint.id)
    setWaypointName(waypoint.name)
    setWaypointSpeed(waypoint.speed || unit?.speed || 0)
  }

  const saveWaypointEdit = () => {
    if (!editingWaypointId) return

    setWaypoints((prev) =>
      prev.map((wp) => {
        if (wp.id === editingWaypointId) {
          return {
            ...wp,
            name: waypointName,
            speed: waypointSpeed,
          }
        }
        return wp
      }),
    )

    setEditingWaypointId(null)
  }

  const cancelWaypointEdit = () => {
    setEditingWaypointId(null)
  }

  const moveWaypointUp = (index: number) => {
    if (index <= 0) return
    const newWaypoints = [...waypoints]
    const temp = newWaypoints[index]
    newWaypoints[index] = newWaypoints[index - 1]
    newWaypoints[index - 1] = temp
    setWaypoints(newWaypoints)
  }

  const moveWaypointDown = (index: number) => {
    if (index >= waypoints.length - 1) return
    const newWaypoints = [...waypoints]
    const temp = newWaypoints[index]
    newWaypoints[index] = newWaypoints[index + 1]
    newWaypoints[index + 1] = temp
    setWaypoints(newWaypoints)
  }

  const toggleWaypointCompleted = (waypointId: string) => {
    setWaypoints((prev) =>
      prev.map((wp) => {
        if (wp.id === waypointId) {
          return {
            ...wp,
            completed: !wp.completed,
          }
        }
        return wp
      }),
    )
  }

  if (!unit) return null

  const formatCoordinates = (coords: [number, number]) => {
    return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Waypoints para {unit.name}</DialogTitle>
          <DialogDescription>Gestiona los puntos de ruta para esta unidad</DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 my-4">
          <Switch id="follow-waypoints" checked={followWaypoints} onCheckedChange={setFollowWaypoints} />
          <Label htmlFor="follow-waypoints">
            Seguir waypoints automáticamente
            {followWaypoints && (
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">(La unidad seguirá esta ruta)</span>
            )}
          </Label>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[300px] w-full rounded-md border">
            {waypoints.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No hay waypoints definidos para esta unidad.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Velocidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waypoints.map((waypoint, index) => (
                    <TableRow key={waypoint.id}>
                      <TableCell>
                        <div className="flex justify-center">
                          <Switch
                            checked={waypoint.completed}
                            onCheckedChange={() => toggleWaypointCompleted(waypoint.id)}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingWaypointId === waypoint.id ? (
                          <Input
                            value={waypointName}
                            onChange={(e) => setWaypointName(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>{waypoint.name}</span>
                            {waypoint.completed && (
                              <Badge variant="outline" className="ml-2 bg-green-100 dark:bg-green-900 text-xs">
                                Completado
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCoordinates(waypoint.position)}</TableCell>
                      <TableCell>
                        {editingWaypointId === waypoint.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={waypointSpeed}
                              onChange={(e) => setWaypointSpeed(Number(e.target.value))}
                              className="h-8 w-20"
                            />
                            <span className="text-xs">kn</span>
                          </div>
                        ) : (
                          <span>{waypoint.speed || unit.speed} kn</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingWaypointId === waypoint.id ? (
                          <div className="flex justify-end space-x-1">
                            <Button variant="outline" size="sm" onClick={cancelWaypointEdit}>
                              Cancelar
                            </Button>
                            <Button variant="default" size="sm" onClick={saveWaypointEdit}>
                              Guardar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveWaypointUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8"
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
                                <path d="m18 15-6-6-6 6" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveWaypointDown(index)}
                              disabled={index === waypoints.length - 1}
                              className="h-8 w-8"
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
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditWaypoint(waypoint)}
                              className="h-8 w-8"
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
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteWaypoint(waypoint.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={handleAddWaypoint} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Waypoint
          </Button>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Guardar Cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

