import { MapPin, Home, Grid3X3, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency, formatNumber } from '../lib/utils';

export default function PropertyCard({ property, analysis, className }) {
  if (!property) return null;

  const summary = analysis?.property_summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-border bg-card p-6 shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="font-heading text-xl font-bold truncate">
            {property.address}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>Dallas, TX</span>
          </div>
        </div>
        {summary?.estimated_current_value && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Est. Value</p>
            <p className="font-heading text-lg font-bold text-gradient">
              {formatCurrency(summary.estimated_current_value)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoChip
          icon={Tag}
          label="Zoning"
          value={property.zoning?.district || 'N/A'}
        />
        <InfoChip
          icon={Grid3X3}
          label="Lot Size"
          value={summary?.estimated_lot_size
            ? `${formatNumber(summary.estimated_lot_size)} sqft`
            : 'N/A'}
        />
        <InfoChip
          icon={Home}
          label="Type"
          value={property.zoning?.description?.split('(')[0]?.trim() || 'Residential'}
        />
        <InfoChip
          icon={MapPin}
          label="Coords"
          value={property.coordinates
            ? `${property.coordinates.lat.toFixed(4)}, ${property.coordinates.lng.toFixed(4)}`
            : 'N/A'}
          mono
        />
      </div>

      {summary?.neighborhood_context && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {summary.neighborhood_context}
        </p>
      )}
    </motion.div>
  );
}

function InfoChip({ icon: Icon, label, value, mono }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={cn('mt-0.5 text-sm font-medium truncate', mono && 'font-mono text-xs')}>
        {value}
      </p>
    </div>
  );
}
