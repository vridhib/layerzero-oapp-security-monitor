import { AlertTriangle, CheckCircle } from "lucide-react";

/**
 * Displays a health indicator badge for a monitored OApp.
 *
 * Renders a colored pill with an icon and label:
 * - Healthy: green with checkmark.
 * - Unhealthy: red with warning triangle.
 * - N/A: gray with "—" (when health data is unavailable).
 *
 * @component
 * @param isHealthy - Indicates health status.
 * @param riskScore - Risk score (optional, for future use).
 * @returns The rendered health badge.
 *
 * @example
 * <HealthBadge isHealthy={true} riskScore={85} />
 * <HealthBadge isHealthy={false} riskScore={20} />
 */
export function HealthBadge({
  isHealthy,
  riskScore
}: {
  isHealthy: boolean | null;
  riskScore: number | null
}) {
  if (isHealthy === null) {
    return <span className="text-gray-400">Unknown</span>;
  }

  const color = isHealthy ? 'bg-green-900/40 text-green-400 border-green-700/50' : 'bg-red-900/40 text-red-400 border-red-700/50';
  const label = isHealthy ? 'Healthy' : 'Unhealthy';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
      {isHealthy ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
      {label}
    </span>
  );

};