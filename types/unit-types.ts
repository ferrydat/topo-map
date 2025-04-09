export type UnitType =
  | "ship"
  | "aircraft"
  | "submarine"
  | "helicopter"
  | "installation"
  | "auxiliary"
  | "intelligence"
  | "drone"
  | "missile"
  | "special"

export type UnitColor = "red" | "blue" | "green"
export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "fog" | "snow"

export type UnitSubtype =
  // Aviones
  | "Avión de Patrulla Marítima"
  | "Avión de Reconocimiento"
  | "Avión de Transporte"
  | "Bombardero Estratégico"
  | "Caza de Cuarta Generación"
  | "Caza de Quinta Generación"
  // Buques de Guerra
  | "Corbeta"
  | "Crucero Lanzamisiles"
  | "Destructor"
  | "Fragata"
  | "Lancha Misilera"
  | "Portaaviones"
  // Buques Auxiliares
  | "Buque Hospital"
  | "Buque de Reabastecimiento"
  | "Transporte Anfibio"
  // Buques de Inteligencia
  | "Barcos Espías"
  | "Sistemas de Vigilancia Naval"
  // Drones
  | "Bayraktar TB2"
  | "MQ-9 Reaper"
  | "S-70 Okhotnik-B"
  // Helicópteros
  | "Helicóptero ASW"
  | "Helicóptero Ligero"
  | "Helicóptero de Ataque"
  | "Helicóptero de Transporte"
  | "Helicóptero de Transporte Pesado"
  | "Helicóptero de Uso General"
  // Instalaciones
  | "Base Aérea"
  | "Base Naval"
  | "Batería SAM"
  | "Centro de Mando"
  | "Depósito de Municiones"
  | "Estación de Comunicaciones"
  | "Instalación Submarina"
  | "Plataforma de Misiles"
  | "Radar Costero"
  // Misiles
  | "Misil Antibuque"
  | "Misiles Hipersónicos"
  | "Railgun"
  | "SLBM"
  | "SSM/Cruise"
  | "Sistemas de Ataque a Larga Distancia"
  | "Torpedo"
  // Submarinos
  | "Submarino AIP"
  | "Submarino Balístico Nuclear"
  | "Submarino Convencional"
  | "Submarino de Ataque Nuclear"
  // Unidades Especiales
  | "Fuerzas de Operaciones Especiales Navales"
  | "SEALs"
  | "Spetsnaz Marinos"

export interface Position {
  coords: [number, number]
  timestamp: number
  turn: number
}

export interface PlannedMovement {
  heading: number
  speed: number
  turn: number // El turno para el que está planificado
}

export interface Waypoint {
  id: string
  position: [number, number]
  name: string
  eta?: Date // Tiempo estimado de llegada
  speed?: number // Velocidad planificada para este tramo
  completed: boolean
}

export interface Sensors {
  radar?: {
    range: number // Range in nautical miles
    active: boolean
  }
  activeSonar?: {
    range: number // Range in nautical miles
    active: boolean
  }
  passiveSonar?: {
    range: number // Range in nautical miles
    active: boolean
  }
}

// Añadir el tipo para el offset de etiquetas
export interface LabelOffset {
  x: number
  y: number
}

export interface Unit {
  id: string
  type: UnitType
  subtype?: UnitSubtype
  color: UnitColor
  position: [number, number]
  name: string
  class: string
  heading: number // Rumbo en grados (0-359)
  speed: number // Velocidad en nudos
  altitude?: number // Altura en pies (para aviones y helicópteros)
  depth?: number // Profundidad en metros (para submarinos)
  trackHistory: Position[] // Historial de posiciones para mostrar el track
  showLabel: boolean // Mostrar/ocultar etiqueta
  labelOffset?: LabelOffset // Offset personalizado para la etiqueta
  plannedMovement?: PlannedMovement // Movimiento planificado para el siguiente turno
  waypoints?: Waypoint[] // Lista de waypoints para la unidad
  followingWaypoints?: boolean // Si la unidad está siguiendo waypoints automáticamente
  sensors?: Sensors // Sensores de la unidad
  detected: boolean // Estado de detección de la unidad
}

export interface TurnState {
  currentTurn: number
  turnType: "tactical" | "intermediate"
  tacticalTurnDuration: number // 30 minutos en segundos
  intermediateTurnDuration: number // 3 minutos en segundos
  currentTime: Date // Hora actual del escenario
}

export interface ScenarioInfo {
  name: string
  date: string
  time: string // Hora en formato HH:MM
  weather: WeatherCondition
  description?: string
}

