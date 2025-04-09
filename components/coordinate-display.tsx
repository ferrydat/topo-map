interface CoordinateDisplayProps {
  position: [number, number]
}

export default function CoordinateDisplay({ position }: CoordinateDisplayProps) {
  const [lat, lng] = position

  // Format coordinates in decimal and degrees/minutes/seconds
  const formatDMS = (coordinate: number, isLatitude: boolean) => {
    const absolute = Math.abs(coordinate)
    const degrees = Math.floor(absolute)
    const minutesNotTruncated = (absolute - degrees) * 60
    const minutes = Math.floor(minutesNotTruncated)
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60)

    const direction = isLatitude ? (coordinate >= 0 ? "N" : "S") : coordinate >= 0 ? "E" : "W"

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`
  }

  return (
    <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded-md shadow-md text-sm z-10">
      <div className="grid grid-cols-2 gap-x-4">
        <div>
          <p className="font-semibold">Decimal:</p>
          <p>Lat: {lat.toFixed(6)}</p>
          <p>Lng: {lng.toFixed(6)}</p>
        </div>
        <div>
          <p className="font-semibold">DMS:</p>
          <p>{formatDMS(lat, true)}</p>
          <p>{formatDMS(lng, false)}</p>
        </div>
      </div>
    </div>
  )
}

