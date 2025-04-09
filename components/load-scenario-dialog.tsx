"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FolderOpen, Trash2, Clock, Database, Upload, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SavedScenario {
  id: string
  name: string
  date: string
  scenarioInfo: any
  turnState: any
  units: any[]
}

interface LoadScenarioDialogProps {
  isOpen: boolean
  onClose: () => void
  scenarios: SavedScenario[]
  onLoad: (scenarioId: string) => void
  onDelete: (scenarioId: string) => void
  onImport: (fileData: any) => void
}

export default function LoadScenarioDialog({
  isOpen,
  onClose,
  scenarios,
  onLoad,
  onDelete,
  onImport,
}: LoadScenarioDialogProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("local")
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLoad = () => {
    if (selectedScenarioId) {
      onLoad(selectedScenarioId)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const fileData = JSON.parse(event.target?.result as string)

        // Validación básica del archivo
        if (!fileData.scenarioInfo || !fileData.turnState || !fileData.units) {
          setImportError("El archivo no contiene un escenario válido")
          return
        }

        onImport(fileData)
        onClose()
      } catch (error) {
        console.error("Error parsing scenario file:", error)
        setImportError("Error al leer el archivo. Asegúrate de que es un escenario válido.")
      }
    }
    reader.onerror = () => {
      setImportError("Error al leer el archivo")
    }
    reader.readAsText(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd MMM yyyy, HH:mm", { locale: es })
    } catch (error) {
      return "Fecha desconocida"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Escenario</DialogTitle>
          <DialogDescription>Selecciona un escenario guardado para cargarlo.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="local" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Escenarios Locales</span>
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Importar Archivo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            {scenarios.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay escenarios guardados.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-2">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedScenarioId === scenario.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{scenario.name}</h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatDate(scenario.date)}</span>
                          </div>
                          <div className="text-xs mt-1">
                            <span className="text-muted-foreground">Unidades:</span>{" "}
                            <span className="font-medium">{scenario.units.length}</span>
                            <span className="mx-2">•</span>
                            <span className="text-muted-foreground">Turno:</span>{" "}
                            <span className="font-medium">{scenario.turnState.currentTurn}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(scenario.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleLoad}
                disabled={!selectedScenarioId || scenarios.length === 0}
                className="flex items-center"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Cargar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="file">
            <div className="py-4">
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="mb-2 font-medium">Haz clic para seleccionar un archivo</p>
                <p className="text-sm text-muted-foreground mb-4">
                  O arrastra y suelta un archivo de escenario (.json)
                </p>
                <Button onClick={triggerFileInput} className="mx-auto">
                  Seleccionar Archivo
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
              </div>

              {importError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground mt-4">
                Selecciona un archivo de escenario previamente exportado para cargarlo.
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

