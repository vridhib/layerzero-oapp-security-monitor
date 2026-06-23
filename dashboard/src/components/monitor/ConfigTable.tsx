import { Database } from 'lucide-react';
import { DVNConfig } from "@/types";
import { ConfigRow } from './ConfigRow';

/**
 * Table component for displaying a list of DVN configurations.
 *
 * Renders a responsive table with the following columns:
 * - Contract Name
 * - Address (truncated)
 * - Chain
 * - Required DVNs
 * - Risk Score
 * - Grade
 * - Health Status
 * - Actions ("Details" button)
 *
 * If the `configs` array is empty, renders an empty state with an icon and
 * a message prompting the user to adjust their filters.
 *
 * @component
 * @param configs - Array of DVN configurations to display.
 * @param onViewDetails - Callback to open the detail modal for a config.
 * @returns The rendered table component.
 *
 * @example
 * <ConfigTable configs={data.results} onViewDetails={setSelectedConfig} />
 *
 * @see {@link ConfigRow} for individual row rendering.
 * @see {@link ContractDetailModal} for the detail view.
 */
export function ConfigTable({
  configs,
  onViewDetails
}: {
  configs: DVNConfig[],
  onViewDetails: (config: DVNConfig) => void
}) {
  return (
    <div className="bg-indigo-900/30 backdrop-blur-sm border border-indigo-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-indigo-800/50">
            <tr className="uppercase tracking-wider text-indigo-300 text-xs">
              <th className="p-4 text-left font-semibold">Contract Name</th>
              <th className="p-4 text-left font-semibold">Address</th>
              <th className="p-4 text-left font-semibold">Remote EID</th>
              <th className="p-4 text-left font-semibold">Chain</th>
              <th className="p-4 text-left font-semibold">Required DVNs</th>
              <th className="p-4 text-left font-semibold">Risk Score</th>
              <th className="p-4 text-left font-semibold">Grade</th>
              <th className="p-4 text-left font-semibold">Health</th>
              <th className="p-4 text-left font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-800/50">
            {configs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Database className="h-12 w-12 text-indigo-400" />
                    <p className="text-indigo-300 text-lg font-medium">No configurations found</p>
                    <p className="text-indigo-400 text-sm">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            ) : (
              configs.map((config) => (
                <ConfigRow key={config.id} config={config} onViewDetails={onViewDetails} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}