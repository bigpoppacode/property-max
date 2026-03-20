# Property Value Maximization Tool - BUILD_SPEC

## Project Overview
Beautiful web app that analyzes properties and shows owners how to maximize value through ADUs, lot splits, or teardown/rebuild based on zoning rules.

**For:** Tadi (demo in 48-72 hours)  
**Focus:** DFW Metro (Dallas-Fort Worth), then Atlanta & Phoenix  
**Priority:** Gorgeous UI + working functionality

## Core Features

### 1. Property Lookup
- Address input with autocomplete
- Support for:
  - Street address
  - Parcel number (APN)
  - Coordinates (lat/long)
- Real-time validation

### 2. Zoning Analysis
- Fetch zoning data from Dallas Open Data API
- Display current zoning classification
- Show allowed uses and restrictions

### 3. Value Maximization Recommendations
AI-powered analysis that checks:

**ADU Potential:**
- Can you build an Accessory Dwelling Unit?
- Size limitations
- Setback requirements
- Estimated rental income potential

**Lot Split Feasibility:**
- Minimum lot size for split
- Subdivision requirements
- Potential value increase

**Teardown/Rebuild Analysis:**
- Maximum building size allowed
- FAR (Floor Area Ratio) calculations
- Height restrictions
- Estimated cost vs value

### 4. Visual Report
Beautiful, shareable PDF/web report with:
- Property overview map
- Current zoning overlay
- Recommendations with estimated values
- Next steps and timeline
- Required permits

## Tech Stack

### Frontend
- **React** (Vite)
- **Tailwind CSS** - Beautiful, responsive design
- **Mapbox GL JS** - Interactive property maps
- **shadcn/ui** - Premium component library
- **Framer Motion** - Smooth animations

### Backend
- **Node.js + Express**
- **Anthropic Claude API** - AI analysis of zoning rules
- **Dallas Open Data API** - Zoning data
- **ATTOM Data API** (optional upgrade) - Comprehensive property data

### Data Sources
1. **Dallas Open Data:**
   - Base URL: `https://www.dallasopendata.com/`
   - Zoning: `https://www.dallasopendata.com/GIS/Dallas-Base-Zoning/8eqv-arii`
   - Free, public API

2. **Claude AI:**
   - Interpret zoning codes
   - Generate recommendations
   - Estimate values and timelines

3. **Mapbox:**
   - Property visualization
   - Zoning overlays
   - Interactive maps

## Design Requirements

### Color Palette
**Primary:** Deep blue/indigo (trust, real estate)  
- Primary: `#2563eb` (blue-600)
- Secondary: `#10b981` (green-500) - for positive recommendations
- Accent: `#f59e0b` (amber-500) - for warnings/considerations
- Background: `#0f172a` (slate-900) dark theme
- Background: `#ffffff` light theme

### Typography
- **Headings:** `Inter` or `Plus Jakarta Sans` (modern, professional)
- **Body:** `Inter` (readable, clean)
- **Monospace:** `JetBrains Mono` (for addresses, codes)

### Layout Principles
1. **Hero section:**
   - Large address search bar (like Google)
   - Tagline: "Unlock your property's hidden value"
   - Beautiful gradient background

2. **Results page:**
   - Split view: Map (left) | Analysis (right)
   - Card-based recommendations
   - Progress indicators for potential value increase

3. **Animations:**
   - Smooth page transitions
   - Loading states with skeleton screens
   - Success animations when analysis completes

### Components
- **Search bar** - Large, prominent, autocomplete
- **Property card** - Image, address, current zoning
- **Recommendation cards** - Icon, title, value estimate, description
- **Interactive map** - Zoning overlay, property boundaries
- **Value calculator** - Slider inputs, real-time estimates
- **CTA buttons** - Gradient, hover effects

## API Integration

### Dallas Open Data (Socrata API)
```javascript
// Get zoning by address
GET https://www.dallasopendata.com/resource/8eqv-arii.json?
  $where=within_box(location, lat_top, lon_left, lat_bottom, lon_right)

// Response includes:
// - zone_dist: Zoning district code
// - zone_desc: Description
// - location: Coordinates
```

### Claude AI Analysis
```javascript
// Prompt structure:
`Analyze this Dallas property zoning: ${zoning_code}
Address: ${address}
Lot size: ${lot_size} sq ft

Provide recommendations for:
1. ADU potential (yes/no, size limits, rental income estimate)
2. Lot split feasibility (yes/no, requirements)
3. Teardown/rebuild (max building size, FAR, estimated value)

Format as JSON with: recommendation_type, feasible, details, estimated_value, timeline, permits_required`
```

### Mapbox Integration
```javascript
// Property map with zoning overlay
- Center on property coordinates
- Display parcel boundaries
- Overlay zoning districts
- Highlight ADU/expansion potential areas
```

## User Flow

1. **Landing page**
   - Hero with search bar
   - "Enter your Dallas property address"
   - Features: Fast, Accurate, Free Analysis

2. **Address entry**
   - Autocomplete suggestions
   - Validate address exists
   - Show loading animation

3. **Analysis loading**
   - Fetching zoning data...
   - Analyzing opportunities...
   - Calculating potential value...
   - (~5-10 seconds with animations)

4. **Results display**
   - Property overview card
   - Interactive map
   - 3 recommendation cards (ADU, Lot Split, Rebuild)
   - Each with:
     - Feasibility status (✅ Recommended, ⚠️ Possible, ❌ Not Allowed)
     - Value estimate
     - Requirements
     - Next steps

5. **Detailed view**
   - Click card to expand
   - See full analysis
   - Download PDF report
   - Share link

## Deliverables

### Phase 1: MVP (48-72 hours)
- [x] Landing page with search
- [x] Dallas Open Data integration
- [x] Claude AI analysis
- [x] Basic map visualization
- [x] 3 recommendation types (ADU, Split, Rebuild)
- [x] Beautiful, responsive UI
- [x] Working demo for Tadi

### Phase 2: Enhancement (future)
- [ ] ATTOM Data API integration (premium data)
- [ ] Atlanta & Phoenix support
- [ ] User accounts & saved searches
- [ ] Email reports
- [ ] Contractor referrals
- [ ] Financial calculators (ROI, mortgage impact)

## File Structure
```
property-max/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── PropertyCard.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── PropertyMap.jsx
│   │   │   └── ValueCalculator.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Results.jsx
│   │   │   └── Details.jsx
│   │   ├── services/
│   │   │   ├── dallasData.js
│   │   │   ├── claudeAI.js
│   │   │   └── mapbox.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── property.js
│   │   │   └── analysis.js
│   │   ├── services/
│   │   │   ├── zoningService.js
│   │   │   ├── aiService.js
│   │   │   └── mapService.js
│   │   └── server.js
│   └── package.json
├── BUILD_SPEC.md
├── README.md
└── .env.example
```

## Environment Variables Needed
```
# Backend (.env)
ANTHROPIC_API_KEY=sk-ant-...
MAPBOX_ACCESS_TOKEN=pk.eyJ1...
DALLAS_OPEN_DATA_APP_TOKEN=... (optional, for higher rate limits)
PORT=3000

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

## Success Criteria
✅ User can enter Dallas address and get analysis in <10 seconds  
✅ Beautiful, modern UI that impresses Tadi  
✅ Accurate zoning data from Dallas Open Data  
✅ AI recommendations that make sense  
✅ Interactive map showing property and zoning  
✅ Value estimates for each opportunity  
✅ Mobile responsive  
✅ Works perfectly for demo

## Notes
- Focus on **Dallas/DFW** first - we have free, reliable data
- Use **Claude AI** to interpret zoning rules (no need to hardcode every rule)
- Keep it **simple but beautiful** - this is a demo to show Tadi
- Make the **value estimates** compelling (use AI to be realistic)
- **Mobile-first** design - real estate people use phones

## Deployment
- Frontend: Vercel or Surge
- Backend: Railway or Heroku
- Quick setup, beautiful domain

---

**Build this gorgeous and make it work perfectly for Tadi's demo! 🏡✨**
