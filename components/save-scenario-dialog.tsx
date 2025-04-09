"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save, Download, Database } from "lucide-react"

interface SaveScenarioDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  onExport: (name: string) => void
  currentName: string
}

export default function SaveScenarioDialog({
  isOpen,
  onClose,
  onSave,
  onExport,
  currentName,
}: SaveScenarioDialogProps) {
  const [scenarioName, setScenarioName] = useState("")
  const [activeTab, setActiveTab] = useState("local")

  // Set default name when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScenarioName(currentName || "Nuevo Escenario")
    }
  }, [isOpen, currentName])

  const handleLocalSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (scenarioName.trim()) {
      onSave(scenarioName.trim())
    }
  }

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault()
    if (scenarioName.trim()) {
      onExport(scenarioName.trim())
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guardar Escenario</DialogTitle>
          <DialogDescription>Guarda el estado actual del escenario para poder cargarlo más tarde.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="local" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Guardar Local</span>
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Exportar Archivo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <form onSubmit={handleLocalSave}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scenario-name-local" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="scenario-name-local"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="col-span-3"
                    autoFocus
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  El escenario se guardará en el almacenamiento local del navegador.
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="file">
            <form onSubmit={handleExport}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="scenario-name-file" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="scenario-name-file"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  El escenario se exportará como un archivo JSON que podrás guardar en tu dispositivo.
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

