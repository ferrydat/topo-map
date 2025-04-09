"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Ship,
  Plane,
  ShipIcon as Submarine,
  BirdIcon as Helicopter,
  Building,
  Radar,
  Rocket,
  Shield,
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
import type { UnitType, UnitColor, UnitSubtype } from "@/types/unit-types"

interface UnitControlsProps {
  activeUnit: UnitType | null
  setActiveUnit: (unit: UnitType | null) => void
  activeColor: UnitColor
  setActiveColor: (color: UnitColor) => void
  activeSubtype: UnitSubtype | null
  setActiveSubtype: (subtype: UnitSubtype | null) => void
}

export default function UnitControls({
  activeUnit,
  setActiveUnit,
  activeColor,
  setActiveColor,
  activeSubtype,
  setActiveSubtype,
}: UnitControlsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Definir categorías y subtipos
  const unitCategories = [
    {
      type: "aircraft" as UnitType,
      label: "Avión",
      icon: <Plane className="h-5 w-5 mb-1" />,
      subtypes: [
        "Avión de Patrulla Marítima",
        "Avión de Reconocimiento",
        "Avión de Transporte",
        "Bombardero Estratégico",
        "Caza de Cuarta Generación",
        "Caza de Quinta Generación",
      ],
    },
    {
      type: "ship" as UnitType,
      label: "Buque de Guerra",
      icon: <Ship className="h-5 w-5 mb-1" />,
      subtypes: ["Corbeta", "Crucero Lanzamisiles", "Destructor", "Fragata", "Lancha Misilera", "Portaaviones"],
    },
    {
      type: "auxiliary" as UnitType,
      label: "Buques Auxiliares",
      icon: <Ship className="h-5 w-5 mb-1" />,
      subtypes: ["Buque Hospital", "Buque de Reabastecimiento", "Transporte Anfibio"],
    },
    {
      type: "intelligence" as UnitType,
      label: "Buques de Inteligencia",
      icon: <Radar className="h-5 w-5 mb-1" />,
      subtypes: ["Barcos Espías", "Sistemas de Vigilancia Naval"],
    },
    {
      type: "drone" as UnitType,
      label: "Drones y UAVs",
      icon: <Plane className="h-5 w-5 mb-1" />,
      subtypes: ["Bayraktar TB2", "MQ-9 Reaper", "S-70 Okhotnik-B"],
    },
    {
      type: "helicopter" as UnitType,
      label: "Helicóptero",
      icon: <Helicopter className="h-5 w-5 mb-1" />,
      subtypes: [
        "Helicóptero ASW",
        "Helicóptero Ligero",
        "Helicóptero de Ataque",
        "Helicóptero de Transporte",
        "Helicóptero de Transporte Pesado",
        "Helicóptero de Uso General",
      ],
    },
    {
      type: "installation" as UnitType,
      label: "Instalaciones",
      icon: <Building className="h-5 w-5 mb-1" />,
      subtypes: [
        "Base Aérea",
        "Base Naval",
        "Batería SAM",
        "Centro de Mando",
        "Depósito de Municiones",
        "Estación de Comunicaciones",
        "Instalación Submarina",
        "Plataforma de Misiles",
        "Radar Costero",
      ],
    },
    {
      type: "missile" as UnitType,
      label: "Misil",
      icon: <Rocket className="h-5 w-5 mb-1" />,
      subtypes: [
        "Misil Antibuque",
        "Misiles Hipersónicos",
        "Railgun",
        "SLBM",
        "SSM/Cruise",
        "Sistemas de Ataque a Larga Distancia",
        "Torpedo",
      ],
    },
    {
      type: "submarine" as UnitType,
      label: "Submarino",
      icon: <Submarine className="h-5 w-5 mb-1" />,
      subtypes: [
        "Submarino AIP",
        "Submarino Balístico Nuclear",
        "Submarino Convencional",
        "Submarino de Ataque Nuclear",
      ],
    },
    {
      type: "special" as UnitType,
      label: "Unidades Especiales",
      icon: <Shield className="h-5 w-5 mb-1" />,
      subtypes: ["Fuerzas de Operaciones Especiales Navales", "SEALs", "Spetsnaz Marinos"],
    },
  ]

  const handleUnitTypeSelect = (type: UnitType) => {
    setActiveUnit(type)
    setActiveSubtype(null)

    // Si ya estaba expandida esta categoría, la cerramos
    if (expandedCategory === type) {
      setExpandedCategory(null)
    } else {
      setExpandedCategory(type)
    }
  }

  const handleSubtypeSelect = (subtype: UnitSubtype) => {
    setActiveSubtype(subtype)
  }

  // Encontrar la categoría activa
  const activeCategory = unitCategories.find((cat) => cat.type === activeUnit)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Colocación de Unidades</h2>

      <div>
        <h3 className="text-sm font-medium mb-2">Tipo de Unidad</h3>
        <div className="grid grid-cols-3 gap-2">
          {unitCategories.map((category) => (
            <Button
              key={category.type}
              variant={activeUnit === category.type ? "default" : "outline"}
              size="sm"
              onClick={() => handleUnitTypeSelect(category.type)}
              className="flex flex-col items-center py-2"
            >
              {category.icon}
              <span className="text-xs">{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {activeUnit && expandedCategory && (
        <div>
          <h3 className="text-sm font-medium mb-2">Subtipo</h3>
          <Select value={activeSubtype || ""} onValueChange={(value) => handleSubtypeSelect(value as UnitSubtype)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un subtipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{activeCategory?.label}</SelectLabel>
                {activeCategory?.subtypes.map((subtype) => (
                  <SelectItem key={subtype} value={subtype}>
                    {subtype}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2">Color de Unidad</h3>
        <RadioGroup
          value={activeColor}
          onValueChange={(value) => setActiveColor(value as UnitColor)}
          className="flex space-x-2"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="blue" id="blue" className="border-blue-500" />
            <Label htmlFor="blue" className="text-sm">
              Azul
            </Label>
          </div>

          <div className="flex items-center space-x-1">
            <RadioGroupItem value="red" id="red" className="border-red-500" />
            <Label htmlFor="red" className="text-sm">
              Rojo
            </Label>
          </div>

          <div className="flex items-center space-x-1">
            <RadioGroupItem value="green" id="green" className="border-green-500" />
            <Label htmlFor="green" className="text-sm">
              Verde
            </Label>
          </div>
        </RadioGroup>
      </div>

      {activeUnit && (
        <div className="pt-2">
          <p className="text-sm">
            Haz clic en el mapa para colocar un {activeSubtype || activeCategory?.label} {activeColor}
          </p>
        </div>
      )}
    </div>
  )
}

