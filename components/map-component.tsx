"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, LayersControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import UnitContextMenu from "./unit-context-menu"

// Implementar memorización para componentes que se renderizan frecuentemente
const MemoizedCircle = React.memo(Circle);
const MemoizedPolyline = React.memo(Polyline);

// Simple component to handle map clicks
function MapClickHandler({ onClick, isMovingUnit, isAddingWaypoint, unitId, isMeasuringDistance, isAddingAnnotation }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const handleClick = (e) => {
      onClick([e.latlng.lat, e.latlng.lng], isAddingWaypoint ? unitId : null)
    }

    map.on("click", handleClick)

    // Change cursor when in moving mode or adding waypoint or measuring or annotating
    if (isMovingUnit || isAddingWaypoint || isMeasuringDistance || isAddingAnnotation) {
      map.getContainer().style.cursor = "crosshair"
    } else {
      map.getContainer().style.cursor = ""
    }

    return () => {
      map.off("click", handleClick)
      map.getContainer().style.cursor = ""
    }
  }, [map, onClick, isMovingUnit, isAddingWaypoint, unitId, isMeasuringDistance, isAddingAnnotation])

  return null
}

// Simple component to track mouse position
function MouseTracker({ onPositionChange }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const handleMouseMove = (e) => {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    }

    map.on("mousemove", handleMouseMove)

    return () => {
      map.off("mousemove", handleMouseMove)
    }
  }, [map, onPositionChange])

  return null
}

// Component to center map on a specific unit
function MapCenterer({ unitToCenter }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !unitToCenter) return

    map.setView(unitToCenter.position, map.getZoom())
  }, [map, unitToCenter])

  return null
}

// Completely rewritten Tactical View overlay component
function TacticalViewOverlay() {
  const map = useMap()
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!map) return

    // Create overlay if it doesn't exist
    if (!overlayRef.current) {
      // First, ensure all map panes have high z-index values
      Object.keys(map.getPanes()).forEach((paneKey) => {
        const pane = map.getPane(paneKey)
        if (pane) {
          pane.style.zIndex = "1000"
        }
      })

      // Create the black overlay
      const overlay = document.createElement("div")
      overlay.className = "tactical-view-overlay"
      overlay.style.position = "absolute"
      overlay.style.top = "0"
      overlay.style.left = "0"
      overlay.style.right = "0"
      overlay.style.bottom = "0"
      overlay.style.backgroundColor = "#000"
      overlay.style.zIndex = "400"
      overlay.style.pointerEvents = "none"

      // Store reference to the overlay
      overlayRef.current = overlay

      // Add overlay to the map container as the first child
      const mapContainer = map.getContainer()
      if (mapContainer.firstChild) {
        mapContainer.insertBefore(overlay, mapContainer.firstChild)
      } else {
        mapContainer.appendChild(overlay)
      }

      // Ensure marker pane is above the overlay
      const markerPane = map.getPane("markerPane")
      if (markerPane) markerPane.style.zIndex = "2000"

      // Ensure overlay pane is above the overlay
      const overlayPane = map.getPane("overlayPane")
      if (overlayPane) overlayPane.style.zIndex = "2000"

      // Ensure popup pane is above the overlay
      const popupPane = map.getPane("popupPane")
      if (popupPane) popupPane.style.zIndex = "3000"

      // Ensure tooltip pane is above the overlay
      const tooltipPane = map.getPane("tooltipPane")
      if (tooltipPane) tooltipPane.style.zIndex = "3000"
    }

    return () => {
      // Clean up overlay when component unmounts
      if (overlayRef.current) {
        overlayRef.current.remove()
        overlayRef.current = null
      }
    }
  }, [map])

  return null
}

// Actualizar la función UnitLabel para manejar el estado de detección
function UnitLabel({ unit, labelOffset = { x: 0, y: 0.02 } }) {
  if (!unit.showLabel) return null

  // Usar el offset personalizado o el predeterminado
  const offset = unit.labelOffset || labelOffset

  // Determinar la clase de detección
  const detectionClass = unit.detected ? "detected" : "undetected"
  const detectionText = unit.detected ? '<span class="text-red-500 font-bold">DETECTADO</span>' : ""

  const labelContent = `
    <div class="unit-label ${detectionClass}">
      <div class="unit-label-name">${unit.name}</div>
      <div class="unit-label-details">
        <span>${unit.class}</span>
        <span>${unit.heading}° / ${unit.speed} kn</span>
        ${unit.altitude ? `<span>Alt: ${unit.altitude} ft</span>` : ""}
        ${unit.depth ? `<span>Prof: ${unit.depth} m</span>` : ""}
        ${detectionText}
      </div>
    </div>
  `

  const labelIcon = L.divIcon({
    html: labelContent,
    className: `unit-label-container ${unit.color}`,
    iconSize: [120, 60],
    iconAnchor: [60, 0],
  })

  // Posición personalizada para la etiqueta
  const labelPosition = [unit.position[0] + offset.y, unit.position[1] + offset.x]

  return (
    <Marker
      position={labelPosition}
      icon={labelIcon}
      interactive={true}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          // Calcular el nuevo offset basado en la posición después de arrastrar
          const newPos = e.target.getLatLng()
          const newOffset = {
            x: newPos.lng - unit.position[1],
            y: newPos.lat - unit.position[0],
          }

          // Disparar un evento personalizado que será capturado en el componente padre
          if (window.updateLabelOffset) {
            window.updateLabelOffset(unit.id, newOffset)
          }
        },
      }}
      zIndexOffset={1000}
    />
  )
}

// Función optimizada para obtener el icono de la unidad
function getUnitIcon(unit) {
  const iconSize = 24
  const color = unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6"

  // Obtener el SVG base según el tipo de unidad
  const baseSvg = getUnitSvg(unit, iconSize, color)

  // Add heading indicator for mobile units (not installations)
  let html = ""
  if (unit.type !== "installation" && unit.heading !== undefined) {
    // Calculate end point for heading line
    const radians = (unit.heading - 90) * (Math.PI / 180) // Convert to radians, -90 to align with north
    const lineLength = 15 // Length of the heading indicator line
    const endX = 16 + Math.cos(radians) * lineLength
    const endY = 16 + Math.sin(radians) * lineLength

    // Create heading indicator
    const headingIndicator = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <line x1="16" y1="16" x2="${endX}" y2="${endY}" stroke="${color}" strokeWidth="2" />
      <circle cx="${endX}" cy="${endY}" r="2" fill="${color}" />
    </svg>`

    html = `<div class="relative">
      ${baseSvg}
      <div class="absolute top-0 left-0">${headingIndicator}</div>
    </div>`
  } else {
    html = `<div class="relative">
      ${baseSvg}
    </div>`
  }

  return L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8">${html}</div>`,
    className: `unit-icon ${unit.detected ? "detected" : "undetected"}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Función auxiliar para obtener el SVG según el tipo de unidad
function getUnitSvg(unit, iconSize, color) {
  // Primero verificar si hay un subtipo específico
  if (unit.subtype) {
    switch (unit.subtype) {
      // Aircraft
      case "Avión de Patrulla Marítima":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18h18M5 12h14M7 6h10M12 3v18M9 9l-3-3M15 9l3-3"/>
        </svg>`
      case "Avión de Reconocimiento":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          <circle cx="16" cy="7" r="1" fill="${color}"/>
        </svg>`
      // Más casos para otros subtipos...
    }
  }

  // Si no hay subtipo o no está en los casos específicos, usar el icono general según el tipo
  switch (unit.type) {
    case "ship":
    case "auxiliary":
    case "intelligence":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1"/>
        <path d="M4 18V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9"/>
        <path d="M10 7V5a2 2 0 0 1 4 0v2"/>
      </svg>`
    case "aircraft":
    case "drone":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>`
    case "submarine":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16"/>
        <path d="M4 12c-1.5 0-2.5 1-2.5 2.5S2.5 17 4 17h16c1.5 0 2.5-1 2.5-2.5S21.5 12 20 12"/>
        <path d="M10 7v5"/>
        <path d="M14 7v5"/>
        <path d="M4 17l-2 3"/>
        <path d="M20 17l2 3"/>
      </svg>`
    case "helicopter":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4a8 8 0 0 1 8 8h-8z"/>
        <path d="M12 4a8 8 0 0 0-8 8h8z"/>
        <path d="M12 12v8"/>
        <path d="M4.2 10H2"/>
        <path d="M22 10h-2.2"/>
        <path d="M12 4V2"/>
      </svg>`
    case "installation":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"/>
        <path d="M5 21V7l8-4v18"/>
        <path d="M19 21V11l-6-4"/>
        <path d="M9 9h1"/>
        <path d="M9 12h1"/>
        <path d="M9 15h1"/>
        <path d="M9 18h1"/>
      </svg>`
    case "missile":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        <path d="m8.5 8.5 3.5 3.5"/>
        <path d="M15.5 15.5 12 12"/>
        <path d="M12 2v8"/>
        <path d="m20 13-1.74 1.74"/>
        <path d="m5.75 5.75-1.74 1.74"/>
      </svg>`
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
      </svg>`
  }
}

// Improved function to create time markers with better error handling
function createTimeMarkerIcon(color, timeString) {
  return L.divIcon({
    html: `
      <div class="time-marker-label" style="border-left-color: ${color};">
        ${timeString}
      </div>
    `,
    className: "time-marker-icon",
    iconSize: [60, 24],
    iconAnchor: [30, 24],
  })
}

// Mejorar la visualización de los waypoints
function getWaypointIcon(completed = false, color = "#3b82f6") {
  const iconSize = 24
  const fillColor = completed ? "#22c55e" : color
  const strokeColor = completed ? "#15803d" : "#2563eb"

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${fillColor}" stroke="${strokeColor}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `

  return L.divIcon({
    html: `<div class="flex items-center justify-center">${html}</div>`,
    className: "waypoint-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  })
}

// Weather overlay component
function WeatherOverlay({ weather }) {
  const map = useMap()
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!map) return

    // Remove any existing weather overlay
    if (overlayRef.current) {
      overlayRef.current.remove()
      overlayRef.current = null
    }

    // Create a new weather overlay based on current weather
    const overlay = document.createElement("div")
    overlay.id = "weather-overlay"
    overlay.className = `weather-overlay ${weather}`
    overlayRef.current = overlay

    // Add the overlay to the map container
    map.getContainer().appendChild(overlay)

    return () => {
      if (overlayRef.current) {
        overlayRef.current.remove()
        overlayRef.current = null
      }
    }
  }, [map, weather])

  return null
}

// Custom scale control that shows nautical miles
function NauticalScaleControl() {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Create a custom scale control
    const scale = L.control.scale({
      maxWidth: 200,
      metric: false,
      imperial: true,
      position: "bottomright",
      nautical: true,
    })

    // Add the scale to the map
    scale.addTo(map)

    // Find the imperial scale element and modify its text
    setTimeout(() => {
      const imperialScale = document.querySelector(".leaflet-control-scale-line")
      if (imperialScale) {
        const text = imperialScale.innerHTML
        // Replace "mi" with "NM" (nautical miles)
        imperialScale.innerHTML = text.replace("mi", "NM")
      }
    }, 500)

    return () => {
      scale.remove()
    }
  }, [map])

  return null
}

// Distance measurement component
function DistanceMeasurement({ measurePoints, unit = "nm" }) {
  const map = useMap()

  if (measurePoints.length < 2) return null

  // Implementar cálculos de distancia más eficientes
  const calculateDistance = useCallback((point1, point2) => {
    // Usar haversine para cálculos precisos de distancia en la Tierra
    const R = 6371; // Radio de la Tierra en km
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Convertir a millas náuticas si es necesario
    return unit === "nm" 
      ? `${(distance * 0.539957).toFixed(2)} nm` 
      : `${distance.toFixed(2)} km`;
  }, [unit]);

  // Calculate total distance
  const calculateTotalDistance = () => {
    let total = 0
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += map.distance(measurePoints[i], measurePoints[i + 1])
    }

    // Convert to selected unit
    switch (unit) {
      case "nm": // Nautical miles
        return (total / 1852).toFixed(2) + " NM"
      case "m": // Meters
        return Math.round(total) + " m"
      case "yd": // Yards
        return Math.round(total * 1.09361) + " yd"
      default:
        return (total / 1852).toFixed(2) + " NM"
    }
  }

  return (
    <>
      <MemoizedPolyline
        positions={measurePoints}
        pathOptions={{
          color: "#3b82f6",
          weight: 3,
          dashArray: "5, 5",
          opacity: 0.8,
        }}
      />
      {measurePoints.map((point, index) => (
        <MemoizedCircle
          key={index}
          center={point}
          radius={300}
          pathOptions={{
            color: index === 0 ? "#22c55e" : "#ef4444",
            fillColor: index === 0 ? "#22c55e" : "#ef4444",
            fillOpacity: 0.6,
          }}
        >
          {index > 0 && (
            <Popup>
              <div className="p-1">
                <p className="text-sm font-medium">
                  Distancia desde punto anterior: {calculateDistance(measurePoints[index - 1], point)}
                </p>
                {index === measurePoints.length - 1 && measurePoints.length > 2 && (
                  <p className="text-sm font-medium mt-1">Distancia total: {calculateTotalDistance()}</p>
                )}
              </div>
            </Popup>
          )}
        </MemoizedCircle>
      ))}

      {/* Display total distance for the line */}
      {measurePoints.length >= 2 && (
        <Popup position={measurePoints[measurePoints.length - 1]}>
          <div className="p-1">
            <p className="text-sm font-medium">Distancia total: {calculateTotalDistance()}</p>
          </div>
        </Popup>
      )}
    </>
  )
}

// Measurement unit selector control
function MeasurementUnitControl({ unit, onChange }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Create a custom control
    const control = L.Control.extend({
      options: {
        position: "bottomleft",
      },
      onAdd: () => {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control measurement-unit-control")
        container.style.backgroundColor = "white"
        container.style.padding = "5px"
        container.style.borderRadius = "4px"
        container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)"

        const select = L.DomUtil.create("select", "", container)
        select.style.border = "none"
        select.style.background = "transparent"
        select.style.outline = "none"

        const options = [
          { value: "nm", label: "Millas Náuticas" },
          { value: "m", label: "Metros" },
          { value: "yd", label: "Yardas" },
        ]

        options.forEach((option) => {
          const optElement = L.DomUtil.create("option", "", select)
          optElement.value = option.value
          optElement.textContent = option.label
          if (option.value === unit) {
            optElement.selected = true
          }
        })

        // Prevent click events from propagating to the map
        L.DomEvent.disableClickPropagation(container)

        // Add change event listener
        L.DomEvent.on(select, "change", (e) => {
          onChange(e.target.value)
        })

        return container
      },
    })

    // Add the control to the map
    const unitControl = new control()
    map.addControl(unitControl)

    return () => {
      map.removeControl(unitControl)
    }
  }, [map, unit, onChange])

  return null
}

// Annotation component
function MapAnnotations({ annotations, onEdit, onDelete }) {
  if (!annotations || annotations.length === 0) return null

  return (
    <>
      {annotations.map((annotation) => (
        <Marker key={annotation.id} position={annotation.position} icon={getAnnotationIcon(annotation.color)}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-base mb-1">{annotation.title}</h3>
              <p className="text-sm mb-2">{annotation.text}</p>
              <div className="flex justify-between mt-2">
                <button
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                  onClick={() => onEdit(annotation.id)}
                >
                  Editar
                </button>
                <button
                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => onDelete(annotation.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Function to get annotation icon
function getAnnotationIcon(color = "#3b82f6") {
  const iconSize = 24

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `

  return L.divIcon({
    html: `<div class="flex items-center justify-center">${html}</div>`,
    className: "annotation-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Sensor range visualization component
function SensorRanges({ units }) {
  return (
    <>
      {units.map((unit) => {
        if (!unit.sensors) return null

        const ranges = []

        // Add radar range
        if (unit.sensors.radar?.active && unit.sensors.radar?.range > 0) {
          ranges.push(
            <Circle
              key={`radar-${unit.id}`}
              center={unit.position}
              radius={unit.sensors.radar.range * 1852} // Convert NM to meters (1 NM = 1852 meters)
              pathOptions={{
                color: unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6",
                fillColor: unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6",
                fillOpacity: 0.05,
                weight: 1,
                dashArray: "5, 5",
              }}
            />,
          )
        }

        // Add active sonar range
        if (unit.sensors.activeSonar?.active && unit.sensors.activeSonar?.range > 0) {
          ranges.push(
            <Circle
              key={`active-sonar-${unit.id}`}
              center={unit.position}
              radius={unit.sensors.activeSonar.range * 1852} // Convert NM to meters
              pathOptions={{
                color: "#10b981", // Green color for active sonar
                fillColor: "#10b981",
                fillOpacity: 0.05,
                weight: 1,
                dashArray: "3, 7",
              }}
            />,
          )
        }

        // Add passive sonar range
        if (unit.sensors.passiveSonar?.active && unit.sensors.passiveSonar?.range > 0) {
          ranges.push(
            <Circle
              key={`passive-sonar-${unit.id}`}
              center={unit.position}
              radius={unit.sensors.passiveSonar.range * 1852} // Convert NM to meters
              pathOptions={{
                color: "#8b5cf6", // Purple color for passive sonar
                fillColor: "#8b5cf6",
                fillOpacity: 0.05,
                weight: 1,
                dashArray: "1, 5",
              }}
            />,
          )
        }

        return ranges
      })}
    </>
  )
}

// Custom component for coordinate grid
function CoordinateGrid() {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Create a custom pane for the grid to control z-index
    if (!map.getPane("grid-pane")) {
      map.createPane("grid-pane")
      map.getPane("grid-pane").style.zIndex = "400" // Above tiles but below markers
      map.getPane("grid-pane").style.pointerEvents = "none" // Make it non-interactive
    }

    // Create a custom grid layer using Leaflet's L.GridLayer
    const gridLayer = new L.GridLayer({
      pane: "grid-pane",
      opacity: 0.5,
    })

    // Override the createTile method
    gridLayer.createTile = (coords) => {
      const tile = document.createElement("div")
      tile.style.width = "256px"
      tile.style.height = "256px"
      tile.style.border = "1px solid rgba(0, 0, 0, 0.2)"
      tile.style.fontSize = "10px"
      tile.style.color = "rgba(0, 0, 0, 0.5)"

      // Add coordinates to the tile
      const point = coords.scaleBy({ x: 256, y: 256 })
      const latlng = map.unproject(point, coords.z)
      const lat = latlng.lat.toFixed(2)
      const lng = latlng.lng.toFixed(2)
      tile.innerHTML = `<div style="padding: 2px;">${lat}, ${lng}</div>`

      return tile
    }

    // Add the grid layer to the map
    gridLayer.addTo(map)

    return () => {
      map.removeLayer(gridLayer)
    }
  }, [map])

  return null
}

// Completely rewritten function to format time with robust error handling
function formatTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "00:00" // Default value if date is invalid
  }

  try {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24h format to avoid AM/PM issues
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "00:00"
  }
}

// Completely rewritten function to calculate scenario time for track points
function calculateScenarioTime(currentTime, currentTurn, positionTurn, turnType) {
  if (!currentTime || !(currentTime instanceof Date) || isNaN(currentTime.getTime())) {
    return new Date() // Return current date if there's an error
  }

  try {
    // Create a copy of the current date to avoid modifying the original
    const scenarioTime = new Date(currentTime.getTime())

    // Calculate turn difference
    const turnDifference = currentTurn - positionTurn

    // Determine minutes per turn based on turn type
    const minutesPerTurn = turnType === "tactical" ? 30 : 3

    // Adjust time by subtracting the appropriate minutes
    scenarioTime.setMinutes(scenarioTime.getMinutes() - turnDifference * minutesPerTurn)

    return scenarioTime
  } catch (error) {
    console.error("Error calculating scenario time:", error)
    return new Date()
  }
}

// New component for Fog of War functionality
function FogOfWar({ enabled, visibleFaction, units }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !enabled) return

    // Apply fog of war effect to all units
    const unitElements = document.querySelectorAll(".unit-icon, .unit-label-container")
    unitElements.forEach((element) => {
      // Check if the element belongs to the visible faction
      const isVisibleFaction = element.classList.contains(visibleFaction)

      if (isVisibleFaction) {
        element.style.opacity = "1"
        element.style.display = "block"
      } else {
        element.style.opacity = "0"
        element.style.display = "none"
      }
    })

    return () => {
      // Reset all units to visible when fog of war is disabled
      const unitElements = document.querySelectorAll(".unit-icon, .unit-label-container")
      unitElements.forEach((element) => {
        element.style.opacity = "1"
        element.style.display = "block"
      })
    }
  }, [map, enabled, visibleFaction, units])

  return null
}

// Updated MapComponent to include Fog of War functionality
export default function MapComponent({
  onMapClick,
  onPositionChange,
  units,
  visibleLayers,
  scenarioInfo,
  unitToCenter,
  isMovingUnit,
  isAddingWaypoint,
  unitIdForWaypoint,
  onEditUnit,
  onMoveUnit,
  onPlanMovement,
  onManageWaypoints,
  onDeleteUnit,
  isMeasuringDistance,
  measurePoints,
  onUpdateLabelOffset,
  measurementUnit = "nm",
  onChangeMeasurementUnit,
  annotations = [],
  isAddingAnnotation = false,
  onEditAnnotation,
  onDeleteAnnotation,
  showTrackMarkers = true,
  fogOfWarEnabled = false,
  fogOfWarFaction = "blue",
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)

  // Fix Leaflet icon issues
  useEffect(() => {
    // Make sure this only runs once on the client
    if (typeof window !== "undefined") {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // Expose the label offset update function for the dragend event
      window.updateLabelOffset = onUpdateLabelOffset
    }
  }, [onUpdateLabelOffset])

  // Handle unit click to show context menu
  const handleUnitClick = (e, unit) => {
    e.originalEvent.stopPropagation()

    // Get click position
    const { clientX, clientY } = e.originalEvent

    setContextMenu({ x: clientX, y: clientY })
    setSelectedUnit(unit)
  }

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null)
    setSelectedUnit(null)
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[40, 0]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        zoomAnimation={true}
        attributionControl={false}
      >
        {visibleLayers.tacticalView && <TacticalViewOverlay />}

        <LayersControl position="topright">
          {visibleLayers.topography && (
            <LayersControl.BaseLayer checked name="Topografía">
              <TileLayer
                attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          )}

          {visibleLayers.coordinates && (
            <LayersControl.Overlay checked name="Rejilla de Coordenadas">
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={0.1} zIndex={5} />
              <CoordinateGrid />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        <MapClickHandler
          onClick={onMapClick}
          isMovingUnit={isMovingUnit}
          isAddingWaypoint={isAddingWaypoint}
          unitId={unitIdForWaypoint}
          isMeasuringDistance={isMeasuringDistance}
          isAddingAnnotation={isAddingAnnotation}
        />
        <MouseTracker onPositionChange={onPositionChange} />
        <WeatherOverlay weather={scenarioInfo.weather} />
        <NauticalScaleControl />

        {/* Apply Fog of War if enabled */}
        {fogOfWarEnabled && <FogOfWar enabled={fogOfWarEnabled} visibleFaction={fogOfWarFaction} units={units} />}

        {isMeasuringDistance && (
          <>
            <DistanceMeasurement measurePoints={measurePoints} unit={measurementUnit} />
            <MeasurementUnitControl unit={measurementUnit} onChange={onChangeMeasurementUnit} />
          </>
        )}

        {/* Component to center map on selected unit */}
        {unitToCenter && <MapCenterer unitToCenter={unitToCenter} />}

        {/* Sensor ranges visualization */}
        <SensorRanges units={units} />

        {/* Render annotations */}
        <MapAnnotations annotations={annotations} onEdit={onEditAnnotation} onDelete={onDeleteAnnotation} />

        {/* Render waypoints and routes for each unit */}
        {units.map((unit) => {
          // Skip if fog of war is enabled and unit is not from visible faction
          if (fogOfWarEnabled && unit.color !== fogOfWarFaction) return null

          if (!unit.waypoints || unit.waypoints.length === 0) return null

          // Create waypoint positions array
          const waypointPositions = unit.waypoints.map((wp) => wp.position)

          // Create route including current position and waypoints
          const routePositions = [unit.position, ...waypointPositions]

          // Mejorar la visualización de las rutas de waypoints para hacerlas más visibles

          // Actualizar el estilo de las rutas de waypoints
          const routeStyle = {
            color: unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6",
            weight: unit.followingWaypoints ? 4 : 2,
            opacity: unit.followingWaypoints ? 0.9 : 0.6,
            dashArray: unit.followingWaypoints ? null : "5, 5",
          }

          return (
            <React.Fragment key={`waypoints-${unit.id}`}>
              {/* Render route line */}
              <Polyline positions={routePositions} pathOptions={routeStyle} />

              {/* Render waypoints */}
              {unit.waypoints.map((waypoint, index) => (
                <Marker
                  key={waypoint.id}
                  position={waypoint.position}
                  icon={getWaypointIcon(
                    waypoint.completed,
                    unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6",
                  )}
                >
                  <Popup className="waypoint-popup">
                    <div className="p-1">
                      <h3 className="font-bold text-base border-b pb-1 mb-2">
                        {waypoint.name || `Waypoint ${index + 1}`}
                      </h3>
                      <p className="text-sm">
                        <span className="font-semibold">Unidad:</span> {unit.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Posición:</span> {waypoint.position[0].toFixed(4)},{" "}
                        {waypoint.position[1].toFixed(4)}
                      </p>
                      {waypoint.speed && (
                        <p className="text-sm">
                          <span className="font-semibold">Velocidad:</span> {waypoint.speed} nudos
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-semibold">Estado:</span> {waypoint.completed ? "Completado" : "Pendiente"}
                      </p>
                      {unit.followingWaypoints &&
                        !waypoint.completed &&
                        index === unit.waypoints.findIndex((wp) => !wp.completed) && (
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                            Objetivo actual
                          </p>
                        )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </React.Fragment>
          )
        })}

        {/* Render track history for each unit */}
        {units.map((unit) => {
          // Skip if fog of war is enabled and unit is not from visible faction
          if (fogOfWarEnabled && unit.color !== fogOfWarFaction) return null

          const trackColor = unit.color === "red" ? "#ef4444" : unit.color === "green" ? "#22c55e" : "#3b82f6"

          return (
            <React.Fragment key={`track-${unit.id}`}>
              {/* Render track line */}
              <Polyline
                positions={unit.trackHistory.map((pos) => pos.coords)}
                pathOptions={{
                  color: trackColor,
                  weight: 2,
                  opacity: 0.7,
                  dashArray: unit.type === "submarine" ? "5, 5" : null,
                }}
              />

              {/* Render track markers with timestamps - FIXED VERSION */}
              {showTrackMarkers &&
                unit.trackHistory.length > 1 &&
                unit.trackHistory.map((pos, index) => {
                  // Skip the first position (starting point) and show markers at regular intervals
                  if (index === 0 || index % 2 !== 0) return null

                  try {
                    // Calculate scenario time for this track point using the improved function
                    const scenarioTime = calculateScenarioTime(
                      scenarioInfo.currentTime,
                      scenarioInfo.currentTurn,
                      pos.turn,
                      scenarioInfo.turnType,
                    )

                    // Format the time using the improved function
                    const timeString = formatTime(scenarioTime)

                    // Create a custom icon for the time marker
                    const timeMarkerIcon = createTimeMarkerIcon(trackColor, timeString)

                    return (
                      <Marker
                        key={`track-marker-${unit.id}-${index}`}
                        position={pos.coords}
                        icon={timeMarkerIcon}
                        interactive={true}
                        zIndexOffset={1000}
                      />
                    )
                  } catch (error) {
                    console.error("Error rendering track marker:", error)
                    return null
                  }
                })}
            </React.Fragment>
          )
        })}

        {/* Render units */}
        {units.map((unit) => {
          // Skip if fog of war is enabled and unit is not from visible faction
          if (fogOfWarEnabled && unit.color !== fogOfWarFaction) return null

          return (
            <div key={unit.id}>
              <Marker
                position={unit.position}
                icon={getUnitIcon(unit)}
                eventHandlers={{
                  click: (e) => handleUnitClick(e, unit),
                }}
                zIndexOffset={2000}
              >
                <Popup className="unit-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-base border-b pb-1 mb-2">{unit.name}</h3>
                    <p className="text-sm">
                      <span className="font-semibold">Clase:</span> {unit.class}
                    </p>
                    {unit.subtype && (
                      <p className="text-sm">
                        <span className="font-semibold">Subtipo:</span> {unit.subtype}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold">Tipo:</span> {unit.type}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Rumbo:</span> {unit.heading}°
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Velocidad:</span> {unit.speed} nudos
                    </p>

                    {(unit.type === "aircraft" || unit.type === "helicopter" || unit.type === "drone") && (
                      <p className="text-sm">
                        <span className="font-semibold">Altitud:</span> {unit.altitude} pies
                      </p>
                    )}

                    {unit.type === "submarine" && (
                      <p className="text-sm">
                        <span className="font-semibold">Profundidad:</span> {unit.depth} metros
                      </p>
                    )}

                    <p className="text-sm">
                      <span className="font-semibold">Posición:</span> {unit.position[0].toFixed(4)},{" "}
                      {unit.position[1].toFixed(4)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Historial:</span> {unit.trackHistory.length} posiciones
                    </p>

                    {unit.waypoints && unit.waypoints.length > 0 && (
                      <p className="text-sm">
                        <span className="font-semibold">Waypoints:</span> {unit.waypoints.length}
                        {unit.followingWaypoints && (
                          <span className="ml-1 text-green-600 dark:text-green-400">(Siguiendo)</span>
                        )}
                      </p>
                    )}

                    {/* Estado de detección */}
                    <p className="text-sm font-bold mt-1">
                      <span className="font-semibold">Estado:</span>{" "}
                      {unit.detected ? (
                        <span className="text-red-500">DETECTADO</span>
                      ) : (
                        <span className="text-gray-500">No detectado</span>
                      )}
                    </p>

                    {/* Sensor information */}
                    {unit.sensors && (
                      <div className="mt-2 border-t pt-1">
                        <p className="text-sm font-semibold">Sensores:</p>
                        {unit.sensors.radar && unit.sensors.radar.active && (
                          <p className="text-xs">
                            <span className="font-medium">Radar:</span> {unit.sensors.radar.range} NM
                          </p>
                        )}
                        {unit.sensors.activeSonar && unit.sensors.activeSonar.active && (
                          <p className="text-xs">
                            <span className="font-medium">Sonar Activo:</span> {unit.sensors.activeSonar.range} NM
                          </p>
                        )}
                        {unit.sensors.passiveSonar && unit.sensors.passiveSonar.active && (
                          <p className="text-xs">
                            <span className="font-medium">Sonar Pasivo:</span> {unit.sensors.passiveSonar.range} NM
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
              <UnitLabel unit={unit} />
            </div>
          )
        })}
      </MapContainer>

      {/* Context menu for unit */}
      {contextMenu && selectedUnit && (
        <UnitContextMenu
          unit={selectedUnit}
          position={contextMenu}
          onClose={closeContextMenu}
          onEdit={onEditUnit}
          onMove={onMoveUnit}
          onPlanMovement={onPlanMovement}
          onManageWaypoints={onManageWaypoints}
          onDelete={onDeleteUnit}
        />
      )}
    </div>
  )
}



