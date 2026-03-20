# Property Value Maximization Tool

**AI-powered property analysis for Dallas/DFW metro area**

Built for Tadi's demo - helps property owners maximize value through ADUs, lot splits, or teardown/rebuild opportunities.

## What It Does

- **Property Lookup**: Enter any Dallas address
- **Zoning Analysis**: Real-time data from Dallas Open Data API
- **AI Recommendations**: Claude AI analyzes 3 opportunities:
  - ADU (Accessory Dwelling Unit) potential
  - Lot split feasibility
  - Teardown/rebuild analysis
- **Interactive Maps**: Mapbox visualization with zoning overlays
- **Value Estimates**: AI-generated ROI calculations

## What Was Built

### Frontend (React + Vite)
- **Landing Page** - Hero with search bar, gradient design
- **Results Page** - Split view (map + analysis cards)
- **Components**:
  - `SearchBar.jsx` - Address autocomplete
  - `PropertyCard.jsx` - Property overview
  - `RecommendationCard.jsx` - ADU/Split/Rebuild cards with value estimates
  - `PropertyMap.jsx` - Mapbox integration with zoning overlay
  - `ValueCalculator.jsx` - Interactive ROI display
  - `LoadingAnalysis.jsx` - Animated loading states
  - `Navbar.jsx` - Navigation

### Backend (Node.js + Express)
- **Services**:
  - `zoningService.js` - Dallas Open Data API integration
  - `aiService.js` - Claude AI analysis engine
  - `mapService.js` - Mapbox helper functions
- **Routes**:
  - `/api/property/analyze` - Full property analysis
  - `/api/property/zoning` - Zoning data lookup

### Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Mapbox GL JS
- **Backend**: Node.js, Express, Anthropic Claude API
- **Data**: Dallas Open Data (Socrata API), Mapbox

## Setup & Run

### 1. Install Dependencies
```bash
cd /home/bigpoppacode/code/obelisk/property-max
npm run install:all
```

### 2. Environment Variables

**Backend** (`backend/.env`):
```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
PORT=3001
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### 3. Run Development Server
```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

### 4. Run Tests
```bash
cd backend && npm install && npm test
```

### 5. Build for Production
```bash
npm run build
```

## Error Handling

The app provides specific, actionable error messages for every failure mode:

| Error Code | What Happened | User Sees |
|---|---|---|
| `API_KEY_INVALID` | Claude API key is wrong/expired | "API Configuration Error" + link to console |
| `API_KEY_MISSING` | No API key set in `.env` | "API Key Missing" + setup instructions |
| `ADDRESS_NOT_FOUND` | Address can't be geocoded in Dallas | "Address Not Found" + format suggestions |
| `ZONING_UNAVAILABLE` | No zoning records for location | "Zoning Data Unavailable" + explanation |
| `NETWORK_ERROR` | Can't reach an external service | "Connection Error" + retry prompt |
| `RATE_LIMIT_EXCEEDED` | 20 searches/hour limit hit | "Search Limit Reached" + wait time |
| `DALLAS_API_ERROR` | Dallas Open Data is down | "Dallas Data Service Error" + retry |
| `MAPBOX_ERROR` | Mapbox geocoding issue | "Map Service Error" + token check |
| `ANALYSIS_FAILED` | AI returned bad response | "Analysis Failed" + retry |

## Rate Limiting

To protect Claude API costs, searches are rate-limited to **20 per hour** per browser.

- **Implementation**: localStorage-based (client-side)
- **Limit**: 20 property analyses per rolling 60-minute window
- **UI**: Shows remaining searches in header and landing page
- **Blocked**: Shows specific "limit reached" error with countdown timer

This is a soft limit (browser-based). For production, consider adding server-side rate limiting with MongoDB Atlas + user accounts.

## Claude API Cost Estimation

### Model Used
**Claude Sonnet 4** (`claude-sonnet-4-20250514`)

### Tokens Per Search

| Step | Input Tokens | Output Tokens |
|---|---|---|
| Property Analysis (full) | ~1,500 | ~3,500 |
| Quick Insight (optional) | ~200 | ~300 |
| **Typical search total** | **~1,500** | **~3,500** |

### Cost Per Search

Using Claude Sonnet 4 pricing ($3/M input, $15/M output):

| Component | Calculation | Cost |
|---|---|---|
| Input tokens | 1,500 tokens x $3/M | $0.0045 |
| Output tokens | 3,500 tokens x $15/M | $0.0525 |
| **Total per search** | | **~$0.057** |

### Monthly Cost Projections

| Usage Level | Searches/Month | Monthly Cost |
|---|---|---|
| Light (demo) | 50 | ~$2.85 |
| Moderate | 200 | ~$11.40 |
| Heavy | 500 | ~$28.50 |
| With rate limit (20/hr max) | ~14,400 max | ~$820 max |

### Cost Optimization Tips
- Rate limiting (20/hour) prevents runaway costs
- Claude Sonnet 4 is used instead of Opus for 5x cost savings with comparable quality
- Each search only makes 1 Claude API call (the full analysis)
- Quick insights are optional and much cheaper (~$0.006 each)

## How It Works

1. **User enters Dallas address** -> Frontend validates and sends to backend
2. **Backend geocodes address** -> Mapbox API converts to coordinates
3. **Backend fetches zoning data** -> Dallas Open Data API (free, public)
4. **Claude AI analyzes zoning** -> Generates recommendations for ADU, lot split, teardown
5. **Results displayed** -> Interactive map + 3 recommendation cards with value estimates

## Example Addresses (Verified Dallas)

These addresses work well for demos:
- **4511 Swiss Ave, Dallas, TX 75204** - Historic Swiss Avenue (residential)
- **6910 Lakewood Blvd, Dallas, TX 75214** - Lakewood area (residential)

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway)
```bash
cd backend
railway init
railway up
```

Update frontend `.env` with production API URL.

## API Keys Needed

1. **Anthropic Claude** - Get at https://console.anthropic.com/
2. **Mapbox** - Get at https://account.mapbox.com/
3. **Dallas Open Data** - No key needed (public API)

## Project Structure

```
property-max/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Landing, Results
│   │   ├── services/       # API client, rate limiting
│   │   ├── lib/            # Utilities
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── lib/            # Error handling utilities
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── server.js
│   ├── tests/              # Test suite
│   └── package.json
├── README.md
└── package.json
```

## Troubleshooting

**"API Configuration Error"?**
- Check `backend/.env` has a valid `ANTHROPIC_API_KEY`
- Verify key at https://console.anthropic.com/

**"Address Not Found"?**
- Use full Dallas street address format
- Example: "4511 Swiss Ave, Dallas, TX 75204"

**"Search Limit Reached"?**
- Wait for the timer to reset (shown in error message)
- Rate limit is 20 searches per hour

**Map not loading?**
- Confirm Mapbox token in both `frontend/.env` and `backend/.env`
- Check browser console for errors

**Port already in use?**
```bash
PORT=3002  # Change in backend/.env
```

---

**Built for Tadi's property value maximization vision!**
