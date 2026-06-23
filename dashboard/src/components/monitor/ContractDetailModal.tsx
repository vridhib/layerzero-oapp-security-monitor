import { DVNConfig } from "@/types";
import { Copy, Check, X, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useState } from "react";


/**
 * Modal that displays detailed security risk information for a DVN configuration.
 *
 * Renders a popup overlay with the following risk metrics:
 * - Contract address (with copy-to-clipboard functionality)
 * - Required DVNs, optional DVNs, confirmations
 * - Boolean flags: exposed, centralized, low confirmations, proxy admin risk,
 *   oracle staleness, and EOA owner.
 * - Risk score and grade.
 * - Raw risk notes (e.g., "Proxy admin is EOA: 0x123...").
 *
 * The modal is triggered by clicking the "Details" button in the public monitor
 * table. It is rendered as a portal overlay with a backdrop that closes the modal
 * on outside click.
 *
 * @component
 * @param config - The DVN configuration object to display.
 * @param onClose - Callback function to close the modal.
 * @returns The rendered modal overlay.
 *
 * @example
 * <ContractDetailModal config={selectedConfig} onClose={() => setSelectedConfig(null)} />
 */
export function ContractDetailModal({ config, onClose }: { config: DVNConfig, onClose: () => void }) {

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const renderBoolean = (value: boolean) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${value
          ? 'bg-red-900/40 text-red-400 border border-red-700/50'
          : 'bg-green-900/40 text-green-400 border border-green-700/50'
        }`}
    >
      {value ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
      {value ? 'Yes' : 'No'}
    </span>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-indigo-900/80 backdrop-blur-sm border border-indigo-700/50 rounded-2xl shadow-2xl shadow-indigo-900/30 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top accent */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Contract Details</h3>
              <p className="text-indigo-300 text-xs font-mono truncate max-w-[200px]">
                {config.contract_address}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-indigo-700/50 transition-colors text-indigo-300 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Address row with copy */}
        <div className="bg-indigo-800/30 border border-indigo-700/40 rounded-xl p-3 mb-5 flex items-center gap-3">
          <code className="flex-1 font-mono text-sm text-indigo-200 truncate">
            {config.contract_address}
          </code>
          <button
            onClick={() => copyAddress(config.contract_address!)}
            className="p-1.5 rounded-lg hover:bg-indigo-700/50 transition-colors text-indigo-300 hover:text-white flex items-center gap-1.5"
          >
            {copiedAddress === config.contract_address ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Copied</span>
              </>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <DetailItem label="Required DVNs" value={config.required_dvn_count} />
          <DetailItem label="Optional DVNs" value={config.optional_dvn_count} />
          <DetailItem label="Confirmations" value={config.confirmations} />
          <DetailItem label="Exposed" value={renderBoolean(config.is_exposed)} />
          <DetailItem label="Centralized" value={renderBoolean(config.is_centralized)} />
          <DetailItem label="Low Confirmations" value={renderBoolean(config.has_low_confirmations)} />
          <DetailItem label="Proxy Admin Risk" value={renderBoolean(config.has_proxy_admin_risk)} />
          <DetailItem label="Oracle Stale" value={renderBoolean(config.is_oracle_stale)} />
          <DetailItem label="EOA Owner" value={renderBoolean(config.is_owner_eoa)} />
          <DetailItem label="Risk Score" value={config.risk_score} />
        </div>

        {/* Risk Notes */}
        {config.risk_notes && (
          <div className="mt-5 pt-4 border-t border-indigo-700/50">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5">
              Risk Notes
            </p>
            <pre className="text-xs text-indigo-200 bg-indigo-800/30 p-3 rounded-xl whitespace-pre-wrap border border-indigo-700/30 font-mono">
              {config.risk_notes}
            </pre>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Helper subcomponent for consistent detail rows
function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <span className="text-indigo-300 font-medium">{label}</span>
      <span className="text-white font-mono justify-self-end">{value}</span>
    </>
  );
}