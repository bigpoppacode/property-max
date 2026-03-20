import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Brain, BarChart3, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  { icon: MapPin, label: 'Locating property...', sublabel: 'Fetching coordinates & parcel data' },
  { icon: Brain, label: 'Fetching zoning data...', sublabel: 'Querying Dallas Open Data API' },
  { icon: BarChart3, label: 'Analyzing opportunities...', sublabel: 'AI evaluating ADU, lot split & rebuild options' },
  { icon: CheckCircle, label: 'Calculating potential value...', sublabel: 'Computing estimates & recommendations' },
];

export default function LoadingAnalysis({ stage = 0 }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (stage > 0) {
      setCurrentStep(stage);
      return;
    }
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, [stage]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Animated orb */}
      <div className="relative mb-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl"
          style={{ width: 120, height: 120, margin: 'auto', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="relative flex h-24 w-24 items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500" />
          <Brain className="h-10 w-10 text-primary" />
        </motion.div>
      </div>

      <h2 className="font-heading text-2xl font-bold mb-2">Analyzing Your Property</h2>
      <p className="text-sm text-muted-foreground mb-8">This typically takes 5-10 seconds</p>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500',
                isActive && 'bg-primary/10 border border-primary/20',
                isComplete && 'opacity-60',
                !isActive && !isComplete && 'opacity-30'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                isComplete && 'bg-emerald-500/20 text-emerald-500',
                !isActive && !isComplete && 'bg-muted text-muted-foreground'
              )}>
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <StepIcon className={cn('h-4 w-4', isActive && 'animate-pulse')} />
                )}
              </div>
              <div>
                <p className={cn('text-sm font-medium', isActive && 'text-primary')}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-muted-foreground"
                  >
                    {step.sublabel}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
