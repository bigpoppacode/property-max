import { useState } from 'react';
import {
  CheckCircle, AlertTriangle, XCircle, HelpCircle,
  Home, Scissors, Hammer, ChevronDown, ChevronUp,
  Clock, DollarSign, FileText, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, getFeasibilityBg, getFeasibilityColor, getFeasibilityLabel } from '../lib/utils';

const typeIcons = {
  adu: Home,
  lot_split: Scissors,
  teardown_rebuild: Hammer,
};

const feasibilityIcons = {
  recommended: CheckCircle,
  possible: AlertTriangle,
  not_allowed: XCircle,
};

export default function RecommendationCard({ recommendation, index = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!recommendation) return null;

  const TypeIcon = typeIcons[recommendation.type] || HelpCircle;
  const FeasIcon = feasibilityIcons[recommendation.feasibility] || HelpCircle;
  const details = recommendation.details || {};

  const valueEstimate = details.estimated_value_add
    || details.estimated_total_value_increase
    || details.estimated_profit
    || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'group rounded-2xl border bg-card shadow-md transition-all duration-300 hover:shadow-lg overflow-hidden',
        getFeasibilityBg(recommendation.feasibility)
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            recommendation.feasibility === 'recommended'
              ? 'bg-emerald-500/15 text-emerald-500'
              : recommendation.feasibility === 'possible'
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-red-500/15 text-red-500'
          )}>
            <TypeIcon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-lg font-bold">
                {recommendation.title}
              </h3>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                getFeasibilityBg(recommendation.feasibility),
                getFeasibilityColor(recommendation.feasibility)
              )}>
                <FeasIcon className="h-3 w-3" />
                {getFeasibilityLabel(recommendation.feasibility)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {recommendation.summary}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {valueEstimate > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Value Add</p>
                <p className="font-heading text-lg font-bold text-emerald-500">
                  +{formatCurrency(valueEstimate)}
                </p>
              </div>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>

        {/* Score bar */}
        {recommendation.feasibility_score && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Feasibility Score</span>
              <span className="font-medium">{recommendation.feasibility_score}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${recommendation.feasibility_score}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                className={cn(
                  'h-full rounded-full',
                  recommendation.feasibility_score >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : recommendation.feasibility_score >= 40
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                )}
              />
            </div>
          </div>
        )}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 p-5 space-y-5">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {details.max_size_sqft && (
                  <MetricBadge label="Max Size" value={`${details.max_size_sqft} sqft`} />
                )}
                {details.estimated_build_cost && (
                  <MetricBadge label="Build Cost" value={formatCurrency(details.estimated_build_cost)} icon={DollarSign} />
                )}
                {details.estimated_rental_income_monthly && (
                  <MetricBadge label="Monthly Rent" value={formatCurrency(details.estimated_rental_income_monthly)} icon={DollarSign} />
                )}
                {details.estimated_rebuild_cost && (
                  <MetricBadge label="Rebuild Cost" value={formatCurrency(details.estimated_rebuild_cost)} icon={DollarSign} />
                )}
                {details.estimated_new_value && (
                  <MetricBadge label="New Value" value={formatCurrency(details.estimated_new_value)} icon={DollarSign} />
                )}
                {details.estimated_new_lot_value && (
                  <MetricBadge label="New Lot Value" value={formatCurrency(details.estimated_new_lot_value)} icon={DollarSign} />
                )}
                {details.far_ratio && (
                  <MetricBadge label="FAR Ratio" value={details.far_ratio.toString()} />
                )}
                {details.height_limit_ft && (
                  <MetricBadge label="Height Limit" value={`${details.height_limit_ft} ft`} />
                )}
                {details.max_building_size_sqft && (
                  <MetricBadge label="Max Building" value={`${details.max_building_size_sqft} sqft`} />
                )}
                {details.timeline_months && (
                  <MetricBadge label="Timeline" value={`${details.timeline_months} months`} icon={Clock} />
                )}
              </div>

              {/* Requirements */}
              {details.key_requirements?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Key Requirements</h4>
                  <ul className="space-y-1.5">
                    {details.key_requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Permits */}
              {recommendation.permits_required?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Permits Required
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.permits_required.map((permit, i) => (
                      <span key={i} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                        {permit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {recommendation.next_steps?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Next Steps</h4>
                  <ol className="space-y-2">
                    {recommendation.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetricBadge({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2.5 border border-border/50">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
