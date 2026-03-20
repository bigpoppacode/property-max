import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function PropertyMap({ coordinates, zoning, className, height = '400px' }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark');

  const styles = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  };

  useEffect(() => {
    if (!mapContainer.current || !coordinates || !MAPBOX_TOKEN) return;

    let map;

    async function initMap() {
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: styles[mapStyle],
        center: [coordinates.lng, coordinates.lat],
        zoom: 16,
        pitch: 45,
        bearing: -10,
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        setMapLoaded(true);

        // Add 3D building layer
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        if (labelLayerId) {
          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#4a90d9',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.5,
              },
            },
            labelLayerId
          );
        }

        // Add a circle showing approximate property area
        map.addSource('property-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coordinates.lng, coordinates.lat],
            },
          },
        });

        map.addLayer({
          id: 'property-highlight',
          type: 'circle',
          source: 'property-area',
          paint: {
            'circle-radius': 40,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.15,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-opacity': 0.6,
          },
        });

        // Pulse effect
        map.addLayer({
          id: 'property-pulse',
          type: 'circle',
          source: 'property-area',
          paint: {
            'circle-radius': 60,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.06,
          },
        });
      });

      // Custom marker
      const markerEl = document.createElement('div');
      markerEl.className = 'property-marker';
      markerEl.innerHTML = `
        <div style="
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #3b82f6, #7c3aed);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white; font-size: 14px; font-weight: bold;
          ">P</div>
        </div>
      `;

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([coordinates.lng, coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="font-family: Inter, sans-serif;">
              <strong style="font-size: 13px;">Subject Property</strong>
              ${zoning?.district ? `<br/><span style="font-size: 12px; opacity: 0.7;">Zoning: ${zoning.district}</span>` : ''}
            </div>
          `)
        )
        .addTo(map);

      markerRef.current = marker;
      mapRef.current = map;
    }

    initMap();

    return () => {
      if (map) map.remove();
    };
  }, [coordinates, mapStyle]);

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => mapRef.current?.resize(), 100);
  }

  function cycleStyle() {
    const order = ['dark', 'light', 'satellite'];
    const next = order[(order.indexOf(mapStyle) + 1) % order.length];
    setMapStyle(next);
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn('flex items-center justify-center rounded-2xl border border-border bg-muted', className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">
          Set VITE_MAPBOX_TOKEN to enable maps
        </p>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className={cn('flex items-center justify-center rounded-2xl border border-border bg-muted', className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">No location data</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border',
        isFullscreen && 'fixed inset-4 z-50',
        className
      )}
      style={isFullscreen ? {} : { height }}
    >
      <div ref={mapContainer} className="h-full w-full" />

      {/* Map controls */}
      <div className="absolute top-3 left-3 flex gap-2">
        <button
          onClick={cycleStyle}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-md hover:bg-card transition-colors"
          title="Change map style"
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-md hover:bg-card transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Zoning badge */}
      {zoning?.district && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-card/90 backdrop-blur-sm border border-border px-3 py-1.5 shadow-md">
          <p className="text-xs text-muted-foreground">Zoning</p>
          <p className="text-sm font-bold font-mono">{zoning.district}</p>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      )}
    </div>
  );
}
