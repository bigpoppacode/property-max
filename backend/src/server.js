import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import propertyRoutes from './routes/property.js';
import analysisRoutes from './routes/analysis.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasMapboxToken = !!process.env.MAPBOX_ACCESS_TOKEN;

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      anthropic: hasAnthropicKey ? 'configured' : 'missing',
      mapbox: hasMapboxToken ? 'configured' : 'missing',
    },
  });
});

app.use('/api/property', propertyRoutes);
app.use('/api/analysis', analysisRoutes);

app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);

  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'An unexpected error occurred';

  res.status(err.statusCode || 500).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    help: 'If this keeps happening, try refreshing the page or searching a different address.',
  });
});

app.listen(PORT, () => {
  console.log(`Property Max API running on port ${PORT}`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set — AI analysis will fail');
  }
  if (!process.env.MAPBOX_ACCESS_TOKEN) {
    console.warn('WARNING: MAPBOX_ACCESS_TOKEN is not set — address lookup will fail');
  }
});
