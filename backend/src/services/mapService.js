export function generateMapConfig(coordinates, zoningData) {
  return {
    center: [coordinates.lng, coordinates.lat],
    zoom: 16,
    style: 'mapbox://styles/mapbox/light-v11',
    markers: [
      {
        type: 'property',
        coordinates: [coordinates.lng, coordinates.lat],
        popup: {
          title: 'Subject Property',
          description: zoningData?.district ? `Zoning: ${zoningData.district}` : 'Property Location',
        },
      },
    ],
    layers: zoningData ? [{
      id: 'zoning-overlay',
      type: 'fill',
      paint: {
        'fill-color': getZoningColor(zoningData.district),
        'fill-opacity': 0.15,
      },
    }] : [],
  };
}

function getZoningColor(zoningCode) {
  if (!zoningCode) return '#6366f1';

  const code = zoningCode.toUpperCase();
  if (code.startsWith('R-') || code.startsWith('TH') || code.startsWith('D(')) return '#22c55e';
  if (code.startsWith('MF')) return '#3b82f6';
  if (code.startsWith('MU')) return '#a855f7';
  if (code.startsWith('CR') || code.startsWith('CS')) return '#f59e0b';
  if (code.startsWith('IM') || code.startsWith('IR')) return '#ef4444';
  if (code.startsWith('PD')) return '#06b6d4';

  return '#6366f1';
}

export function getZoningColorScheme(zoningCode) {
  const color = getZoningColor(zoningCode);
  return {
    primary: color,
    fill: color + '20',
    stroke: color,
  };
}
