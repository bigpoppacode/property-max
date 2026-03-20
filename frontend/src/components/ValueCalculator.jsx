import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function ValueCalculator({ analysis, className }) {
  if (!analysis) return null;

  const summary = analysis.property_summary;
  const recommendations = analysis.recommendations || [];
  const totalIncrease = analysis.total_potential_value_increase || 0;
  const currentValue = summary?.estimated_current_value || 0;

  const bestRec = recommendations.find(r => r.type === analysis.best_recommendation);
  const percentIncrease = currentValue > 0 ? ((totalIncrease / currentValue) * 100).toFixed(0) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        'rounded-2xl border border-border overflow-hidden',
        className
      )}
    >
      {/* Value increase header */}
      <div className="bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-blue-600/5 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Total Potential Value Increase
        </div>
        <div className="flex items-baseline gap-3">
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="font-heading text-3xl sm:text-4xl font-extrabold text-gradient"
          >
            +{formatCurrency(totalIncrease)}
          </motion.p>
          {percentIncrease > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-semibold text-emerald-500"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {percentIncrease}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Value breakdown */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Estimated Value</span>
          <span className="font-semibold">{formatCurrency(currentValue)}</span>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const value = rec.details?.estimated_value_add
              || rec.details?.estimated_total_value_increase
              || rec.details?.estimated_profit
              || 0;

            return (
              <div key={rec.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      rec.feasibility === 'recommended'
                        ? 'bg-emerald-500'
                        : rec.feasibility === 'possible'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    )} />
                    {rec.title}
                  </span>
                  <span className={cn(
                    'font-medium',
                    value > 0 ? 'text-emerald-500' : 'text-muted-foreground'
                  )}>
                    {value > 0 ? `+${formatCurrency(value)}` : 'N/A'}
                  </span>
                </div>
                {totalIncrease > 0 && value > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / totalIncrease) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                      className={cn(
                        'h-full rounded-full',
                        rec.feasibility === 'recommended'
                          ? 'bg-emerald-500'
                          : rec.feasibility === 'possible'
                            ? 'bg-amber-500'
                            : 'bg-red-400'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Best recommendation callout */}
        {bestRec && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-primary/20 p-4">
            <p className="text-xs font-medium text-primary mb-1">Best Opportunity</p>
            <p className="text-sm font-semibold">{bestRec.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{bestRec.summary}</p>
          </div>
        )}

        {/* Market context */}
        {analysis.market_context && (
          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
            {analysis.market_context}
          </p>
        )}
      </div>
    </motion.div>
  );
}
