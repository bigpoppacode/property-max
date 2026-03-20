import { AppError, ErrorCode } from '../lib/errors.js';

const DALLAS_ZONING_URL = 'https://egis.dallascityhall.com/arcgis/rest/services/Sdc_public/Zoning/MapServer/15/query';
const ZONING_OUT_FIELDS = 'ZONE_DIST,LONG_ZONE_DIST,PD_NUM,CD_NUM,CASE_NUMBER,COMMON_NAME,ORD_NUM,NOTES';

export async function getZoningByLocation(lat, lng, radiusMeters = 200) {
  const url = new URL(DALLAS_ZONING_URL);
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', ZONING_OUT_FIELDS);
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('distance', String(radiusMeters));
  url.searchParams.set('units', 'esriSRUnit_Meter');
  url.searchParams.set('resultRecordCount', '10');
  url.searchParams.set('f', 'json');

  let response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new AppError(
      ErrorCode.NETWORK_ERROR,
      'Could not connect to Dallas GIS service',
      503,
      'The Dallas city data service may be temporarily down. Try again in a few minutes.'
    );
  }

  if (!response.ok) {
    throw new AppError(
      ErrorCode.DALLAS_API_ERROR,
      `Dallas GIS service returned ${response.status}: ${response.statusText}`,
      502,
      'The city data service returned an error. This is usually temporary — try again shortly.'
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new AppError(
      ErrorCode.DALLAS_API_ERROR,
      `Dallas GIS query error: ${data.error.message}`,
      502,
      'The city data service returned an error. This is usually temporary — try again shortly.'
    );
  }

  return (data.features || []).map(f => f.attributes);
}

export async function getZoningByAddress(address) {
  const coords = await geocodeAddress(address);
  if (!coords) {
    throw new AppError(
      ErrorCode.ADDRESS_NOT_FOUND,
      `Could not find "${address}" in the Dallas area`,
      404,
      'Make sure this is a valid Dallas, TX street address. Try the full format: "1234 Street Name, Dallas, TX".'
    );
  }

  const zoningData = await getZoningByLocation(coords.lat, coords.lng);

  if (!zoningData || zoningData.length === 0) {
    throw new AppError(
      ErrorCode.ZONING_UNAVAILABLE,
      `No zoning data found for "${address}"`,
      404,
      'This address was located on the map but has no zoning records in the Dallas database. It may be outside Dallas city limits or in an unzoned area.'
    );
  }

  return {
    address: coords.formattedAddress || address,
    coordinates: coords,
    zoning: zoningData,
  };
}

export async function geocodeAddress(address) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    throw new AppError(
      ErrorCode.API_KEY_MISSING,
      'Mapbox access token is not configured',
      500,
      'The MAPBOX_ACCESS_TOKEN environment variable is missing. Set it in backend/.env to enable address lookup.'
    );
  }

  const query = encodeURIComponent(`${address}, Dallas, TX`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&limit=5&bbox=-97.5,32.5,-96.3,33.1&types=address`;

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new AppError(
      ErrorCode.NETWORK_ERROR,
      'Could not connect to Mapbox geocoding service',
      503,
      'Check your internet connection and try again.'
    );
  }

  if (response.status === 401) {
    throw new AppError(
      ErrorCode.MAPBOX_ERROR,
      'Mapbox access token is invalid or expired',
      401,
      'Check that MAPBOX_ACCESS_TOKEN in backend/.env is correct. Get a token at https://account.mapbox.com/'
    );
  }

  if (!response.ok) {
    throw new AppError(
      ErrorCode.MAPBOX_ERROR,
      `Mapbox geocoding error: ${response.status} ${response.statusText}`,
      502,
      'The address lookup service returned an error. Try again in a moment.'
    );
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    return null;
  }

  const feature = data.features[0];
  return {
    lat: feature.center[1],
    lng: feature.center[0],
    formattedAddress: feature.place_name,
    bbox: feature.bbox,
  };
}

export async function searchAddresses(query) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    return [];
  }

  const encoded = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${mapboxToken}&limit=5&bbox=-97.5,32.5,-96.3,33.1&types=address&country=US`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.features || []).map(f => ({
    address: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
  }));
}

export function parseZoningData(rawZoning) {
  if (!rawZoning || rawZoning.length === 0) {
    return {
      district: 'Unknown',
      description: 'No zoning data available for this location',
      details: {},
    };
  }

  const zone = rawZoning[0];
  const district = zone.LONG_ZONE_DIST || zone.ZONE_DIST || 'Unknown';
  return {
    district,
    description: formatZoningCode(zone.ZONE_DIST || ''),
    overlay: zone.PD_NUM ? `PD-${zone.PD_NUM}` : null,
    subdistrict: zone.CD_NUM ? `CD-${zone.CD_NUM}` : null,
    caseNumber: zone.CASE_NUMBER || null,
    commonName: zone.COMMON_NAME || null,
    raw: zone,
  };
}

function formatZoningCode(code) {
  const zoningMap = {
    'R-': 'Residential',
    'MF-': 'Multi-Family Residential',
    'A(A)': 'Agricultural',
    'CR': 'Commercial Retail',
    'CS': 'Commercial Service',
    'MU-': 'Mixed Use',
    'IM': 'Industrial Manufacturing',
    'IR': 'Industrial Research',
    'PD': 'Planned Development',
    'TH-': 'Townhouse',
    'D(A)': 'Duplex',
  };

  for (const [prefix, name] of Object.entries(zoningMap)) {
    if (code.startsWith(prefix)) {
      return `${name} (${code})`;
    }
  }

  return code || 'Unknown District';
}
