import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  if (!num && num !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
}

export function getFeasibilityColor(feasibility) {
  switch (feasibility) {
    case 'recommended':
      return 'text-emerald-500';
    case 'possible':
      return 'text-amber-500';
    case 'not_allowed':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}

export function getFeasibilityBg(feasibility) {
  switch (feasibility) {
    case 'recommended':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'possible':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'not_allowed':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-muted border-border';
  }
}

export function getFeasibilityLabel(feasibility) {
  switch (feasibility) {
    case 'recommended':
      return 'Recommended';
    case 'possible':
      return 'Possible';
    case 'not_allowed':
      return 'Not Allowed';
    default:
      return 'Unknown';
  }
}

export function getFeasibilityIcon(feasibility) {
  switch (feasibility) {
    case 'recommended':
      return 'CheckCircle';
    case 'possible':
      return 'AlertTriangle';
    case 'not_allowed':
      return 'XCircle';
    default:
      return 'HelpCircle';
  }
}
