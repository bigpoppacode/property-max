import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, AlertCircle, WifiOff,
  KeyRound, MapPinOff, Clock, ShieldAlert, Info,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import PropertyMap from '../components/PropertyMap';
import RecommendationCard from '../components/RecommendationCard';
import ValueCalculator from '../components/ValueCalculator';
import LoadingAnalysis from '../components/LoadingAnalysis';
import { lookupProperty, analyzeProperty } from '../services/api';
import { getRemainingSearches, MAX_SEARCHES_PER_HOUR } from '../services/rateLimit';

const ERROR_CONFIG = {
  RATE_LIMIT_EXCEEDED: {
    icon: Clock,
    title: 'Search Limit Reached',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  API_KEY_INVALID: {
    icon: KeyRound,
    title: 'API Configuration Error',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  API_KEY_MISSING: {
    icon: KeyRound,
    title: 'API Key Missing',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  ADDRESS_NOT_FOUND: {
    icon: MapPinOff,
    title: 'Address Not Found',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  ZONING_UNAVAILABLE: {
    icon: Info,
    title: 'Zoning Data Unavailable',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    title: 'Connection Error',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  MAPBOX_ERROR: {
    icon: MapPinOff,
    title: 'Map Service Error',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  DALLAS_API_ERROR: {
    icon: ShieldAlert,
    title: 'Dallas Data Service Error',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  ANALYSIS_FAILED: {
    icon: AlertCircle,
    title: 'Analysis Failed',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

const DEFAULT_ERROR_CONFIG = {
  icon: AlertCircle,
  title: 'Something Went Wrong',
  color: 'text-destructive',
  bg: 'bg-destructive/10',
};

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(getRemainingSearches());

  const address = searchParams.get('address');

  const runAnalysis = useCallback(async (addr) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setLoadingStage(0);

    try {
      setLoadingStage(0);
      const propData = await lookupProperty(addr);
      setProperty(propData);

      setLoadingStage(1);
      setLoadingStage(2);
      const analysisResult = await analyzeProperty({
        address: propData.address,
        zoning: propData.zoning,
        coordinates: propData.coordinates,
      });

      setLoadingStage(3);

      setTimeout(() => {
        setAnalysis(analysisResult.analysis);
        setLoading(false);
        setRemaining(getRemainingSearches());
      }, 500);
    } catch (err) {
      console.error('Analysis error:', err);
      setError({
        message: err.message || 'Failed to analyze property. Please try again.',
        code: err.code || 'UNKNOWN_ERROR',
        help: err.help || 'Try again or use a different address.',
      });
      setLoading(false);
      setRemaining(getRemainingSearches());
    }
  }, []);

  useEffect(() => {
    if (address) {
      runAnalysis(address);
    }
  }, [address, runAnalysis]);

  function handleNewSearch(newAddress, suggestion) {
    const params = new URLSearchParams({ address: newAddress });
    if (suggestion?.lat && suggestion?.lng) {
      params.set('lat', suggestion.lat);
      params.set('lng', suggestion.lng);
    }
    navigate(`/results?${params.toString()}`);
  }

  if (!address) {
    navigate('/');
    return null;
  }

  const errCfg = error ? (ERROR_CONFIG[error.code] || DEFAULT_ERROR_CONFIG) : null;
  const ErrIcon = errCfg?.icon;

  return (
    <div className="min-h-screen pt-16">
      {/* Search header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <SearchBar onSearch={handleNewSearch} className="flex-1" />
            {remaining < MAX_SEARCHES_PER_HOUR && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {remaining}/{MAX_SEARCHES_PER_HOUR} searches left
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingAnalysis stage={loadingStage} />}

      {/* Error State */}
      {error && !loading && (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${errCfg.bg} mx-auto mb-4`}>
            <ErrIcon className={`h-8 w-8 ${errCfg.color}`} />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">{errCfg.title}</h2>
          <p className="text-muted-foreground mb-3">{error.message}</p>

          {error.help && (
            <div className="inline-flex items-start gap-2 rounded-xl bg-muted/50 border border-border px-4 py-3 mb-6 text-left max-w-md">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{error.help}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-2">
            {error.code !== 'RATE_LIMIT_EXCEEDED' && (
              <button
                onClick={() => runAnalysis(address)}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              {error.code === 'ADDRESS_NOT_FOUND' ? 'Try Different Address' : 'New Search'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && property && analysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8"
        >
          {/* Action bar */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-xl sm:text-2xl font-bold">
              Property Analysis
            </h1>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {remaining}/{MAX_SEARCHES_PER_HOUR} searches remaining
              </span>
              <button
                onClick={() => runAnalysis(address)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          </div>

          {/* Main content: responsive split layout */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left column: Map + Property Card */}
            <div className="lg:col-span-2 space-y-6">
              <PropertyMap
                coordinates={property.coordinates}
                zoning={property.zoning}
                height="350px"
              />
              <PropertyCard property={property} analysis={analysis} />
              <ValueCalculator analysis={analysis} />
            </div>

            {/* Right column: Recommendations */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                Recommendations
                <span className="text-xs font-normal text-muted-foreground">
                  ({analysis.recommendations?.length || 0} strategies analyzed)
                </span>
              </h2>

              {analysis.recommendations?.map((rec, index) => (
                <RecommendationCard
                  key={rec.type}
                  recommendation={rec}
                  index={index}
                />
              ))}

              {/* Disclaimer */}
              <div className="rounded-xl bg-muted/50 border border-border p-4 mt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Disclaimer:</strong> This analysis is generated using AI and public zoning data.
                  Estimates are approximate and should not replace professional real estate, legal, or
                  architectural advice. Always verify zoning regulations with the City of Dallas and
                  consult licensed professionals before proceeding with any development project.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
