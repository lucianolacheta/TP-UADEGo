import { useEffect, useRef, useState } from 'react'
import {
  cargarGoogleMapsSDK,
  coordsDestino,
  coordsOrigen,
  getGoogleMapsApiKey,
} from '../../lib/googleMaps'
import MapPlaceholder from './MapPlaceholder'

interface Props {
  origen: string
  destino: string
  puntoEncuentro?: string | null
}

const CABA = { lat: -34.6037, lng: -58.3816 }

export default function TripMap({ origen, destino, puntoEncuentro }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fallo, setFallo] = useState(!getGoogleMapsApiKey())
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!getGoogleMapsApiKey()) return

    let cancelado = false

    async function initMap() {
      const container = containerRef.current
      if (!container) return

      try {
        await cargarGoogleMapsSDK()
        if (cancelado) return

        const googleMaps = (window as any).google.maps
        const map = new googleMaps.Map(container, {
          center: CABA,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })

        const [from, to] = await Promise.all([
          coordsOrigen(origen, puntoEncuentro),
          Promise.resolve(coordsDestino(destino)),
        ])
        if (cancelado) return

        const bounds = new googleMaps.LatLngBounds()
        bounds.extend(from)
        bounds.extend(to)
        map.fitBounds(bounds, 56)

        new googleMaps.Marker({
          map,
          position: from,
          title: 'Origen',
          label: 'A',
        })
        new googleMaps.Marker({
          map,
          position: to,
          title: 'Destino',
          label: 'B',
        })

        new googleMaps.Polyline({
          map,
          path: [from, to],
          strokeColor: '#2563EB',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        })

        // Asegura que los tiles se rendericen bien dentro del contenedor
        googleMaps.event.trigger(map, 'resize')
        map.fitBounds(bounds, 56)

        if (!cancelado) setListo(true)
      } catch {
        if (!cancelado) setFallo(true)
      }
    }

    initMap()

    return () => { cancelado = true }
  }, [origen, destino, puntoEncuentro])

  if (fallo) {
    return <MapPlaceholder origen={origen} destino={destino} />
  }

  return (
    <div className="trip-map">
      <div ref={containerRef} className="trip-map-canvas" aria-label="Mapa del viaje" />
      {!listo && (
        <div className="trip-map-loading">Cargando mapa...</div>
      )}
    </div>
  )
}
