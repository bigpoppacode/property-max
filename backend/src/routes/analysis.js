import { Router } from 'express';
import { analyzeProperty, getQuickInsight } from '../services/aiService.js';
import { errorResponse } from '../lib/errors.js';

const router = Router();

router.post('/full', async (req, res) => {
  try {
    const { address, zoning, coordinates, lotSize } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Address is required',
        code: 'INVALID_REQUEST',
        help: 'Include an "address" field in the request body.',
      });
    }

    const analysis = await analyzeProperty({ address, zoning, coordinates, lotSize });

    res.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    errorResponse(res, error);
  }
});

router.get('/insight', async (req, res) => {
  try {
    const { zoning, question } = req.query;

    if (!zoning || !question) {
      return res.status(400).json({
        error: 'zoning and question are required',
        code: 'INVALID_REQUEST',
        help: 'Include ?zoning=R-7.5&question=your+question in the request.',
      });
    }

    const insight = await getQuickInsight(zoning, question);
    res.json({ insight });
  } catch (error) {
    console.error('Insight error:', error);
    errorResponse(res, error);
  }
});

export default router;
