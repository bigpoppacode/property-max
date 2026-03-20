import { Router } from 'express';
import { getZoningByAddress, getZoningByLocation, searchAddresses, parseZoningData } from '../services/zoningService.js';
import { generateMapConfig } from '../services/mapService.js';
import { errorResponse } from '../lib/errors.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.json({ results: [] });
    }

    const results = await searchAddresses(q);
    res.json({ results });
  } catch (error) {
    console.error('Address search error:', error);
    errorResponse(res, error);
  }
});

router.get('/lookup', async (req, res) => {
  try {
    const { address, lat, lng } = req.query;

    let result;
    if (address) {
      result = await getZoningByAddress(address);
    } else if (lat && lng) {
      const zoningData = await getZoningByLocation(parseFloat(lat), parseFloat(lng));
      result = {
        address: `${lat}, ${lng}`,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        zoning: zoningData,
      };
    } else {
      return res.status(400).json({
        error: 'Provide an address or lat/lng coordinates',
        code: 'INVALID_REQUEST',
        help: 'Include ?address=1234+Main+St or ?lat=32.78&lng=-96.80 in your request.',
      });
    }

    const parsedZoning = parseZoningData(result.zoning);
    const mapConfig = generateMapConfig(result.coordinates, parsedZoning);

    res.json({
      address: result.address,
      coordinates: result.coordinates,
      zoning: parsedZoning,
      zoningRaw: result.zoning,
      mapConfig,
    });
  } catch (error) {
    console.error('Property lookup error:', error);
    errorResponse(res, error);
  }
});

router.get('/zoning', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'lat and lng are required',
        code: 'INVALID_REQUEST',
        help: 'Include ?lat=32.78&lng=-96.80 in your request.',
      });
    }

    const zoningData = await getZoningByLocation(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined
    );

    res.json({
      zoning: parseZoningData(zoningData),
      raw: zoningData,
    });
  } catch (error) {
    console.error('Zoning lookup error:', error);
    errorResponse(res, error);
  }
});

export default router;
