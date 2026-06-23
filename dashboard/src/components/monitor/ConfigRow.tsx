import { DVNConfig } from "@/types";
import { CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Individual table row for displaying a DVN configuration 
 * in the public monitor.
 * 
 * Renders a single configuration with the following columns:
 * - Contract name (falls back to "—")
 * - Contract address (truncated to first 6 and last 4 characters)
 * - Chain (rendered as pill badge)
 * - Required DVN count
 * - Risk score (color-coded: green >=75, yellow >=50, red <50)
 * - Grade (letter grade A-F in a circular badge)
 * - Health status (Healthy/Unhealthy with icon)
 * - "Details" button to open the {@link ContractDetailModal}
 * 
 * @component
 * @param config - The DVNConfig configuration object to display.
 * @param onViewDetails - Callback to open the detail modal for this configuration.
 * @returns The rendered table row.
 * 
 * @example
 * <ConfigRow config={config} onViewDetails={setSelectedConfig} />
 *
 * @see {@link ConfigTable} for the parent table component.
 * @see {@link ContractDetailModal} for the detail view.
 */
export function ConfigRow({
  config,
  onViewDetails
}: {
  config: DVNConfig,
  onViewDetails: (config: DVNConfig) => void
}) {
  const getRiskColor = (score: number) => {
    if (score >= 75) {
      return 'bg-green-900/40 text-green-400 border border-green-700/50';
    } else if (score >= 50) {
      return 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50';
    } else {
      return 'bg-red-900/40 text-red-400 border border-red-700/50';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') {
      return 'bg-green-900/40 text-green-400 border border-green-700/50';
    } else if (grade === 'B') {
      return 'bg-blue-900/40 text-blue-400 border border-blue-700/50';
    } else if (grade === 'C') {
      return 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50';
    } else {
      'bg-red-900/40 text-red-400 border border-red-700/50'
    }
  };

  return (
    <tr className="hover:bg-indigo-800/30 transition-colors group">
      <td className="p-4 font-medium text-white">
        {config.contract_name || <span className="text-indigo-400">—</span>}
      </td>
      <td className="p-4 font-mono text-sm text-indigo-300">
        {config.contract_address?.slice(0, 6)}...{config.contract_address?.slice(-4)}
      </td>
      <td className="p-4 text-center font-mono text-white">
        {config.remote_eid}
      </td>
      <td className="p-4">
        <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-700/40 text-indigo-200 text-xs font-medium">
          {config.contract_chain || 'unknown'}
        </span>
      </td>
      <td className="p-4 text-center font-mono text-white">
        {config.required_dvn_count}
      </td>
      <td className="p-4">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(config.risk_score)}`}>
          {config.risk_score}
        </span>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getGradeColor(config.grade)}`}>
          {config.grade || 'N/A'}
        </span>
      </td>
      <td className="p-4">
        {config.is_healthy ? (
          <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Healthy
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-red-400 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Unhealthy
          </span>
        )}
      </td>
      <td className="p-4 text-center">
        <button
          onClick={() => onViewDetails(config)}
          className="px-4 py-2 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200 text-sm font-medium"
          aria-label="View details"
        >
          Details →
        </button>
      </td>
    </tr>
  );
}