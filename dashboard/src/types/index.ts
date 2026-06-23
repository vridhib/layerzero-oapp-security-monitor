// ------------------ Paginated Responses ------------------
/**
 * API response for paginated lists of DVN configurations.
 * @see {@link DVNConfig}
 */
export interface PaginatedDVNConfigs {
  /** Total number of records across all pages. */
  count: number;
  /** URL to the next page, or `null` if on the last page. */
  next: string | null;
  /** URL to the previous page, or `null` if on the first page. */
  previous: string | null;
  /** Array of DVN configurations for the current page. */
  results: DVNConfig[];
}


// ------------------ Core Domain Models -------------------
/**
 * A LayerZero DVN (Decentralized Verifier Network) configuration.
 * Retrieved from the `/api/dvn-configs/` endpoint. Each record 
 * represents the security posture of an OApp's DVN setup for a 
 * specific remote endpoint.
 */
export interface DVNConfig {
  id: number;
  /** ID of the related BridgeContract (foreign key). */
  contract: number;
  /** Checksummed address of the contract. */
  contract_address?: string;
  /** Human-readable name of the contract. */
  contract_name?: string;
  /** Chain identifier (e.g., "ethereum", "arbitrum"). */
  contract_chain?: string;  
  /** LayerZero remote endpoint ID (e.g., 30101 for Ethereum mainnet). */
  remote_eid: number;
  /** Number of required DVNs that must confirm a message. */
  required_dvn_count: number;
  /** Threshold of optional DVNs that must confirm (default: 0). */
  optional_dvn_threshold: number;
  /** Total number of optional DVNs configured. */
  optional_dvn_count: number;
  /** List of required DVN addresses (hex strings). */
  required_dvns: string[];
  /** List of optional DVN addresses (hex strings). */
  optional_dvns: string[];
  /** Number of block confirmations required for message finality. */
  confirmations: number;
  /** `true` if the configuration is considered "exposed" (e.g., 1-of-1 setup). */
  is_exposed: boolean;
  /** `true` if all required DVNs are from the same provider (centralization risk). */
  is_centralized: boolean;
  /** `true` if `confirmations` is below the safe threshold (< 4). */
  has_low_confirmations: boolean;
  /** `true` if the proxy admin is an EOA, a single-signer multisig, or a timelock with <24h delay. */
  has_proxy_admin_risk: boolean;
  /** `true` if the contract's price feed oracle hasn't been updated in the last hour. */
  is_oracle_stale: boolean;
  /** `true` if the contract owner is an EOA (centralization risk). */
  is_owner_eoa: boolean;
  /** Detailed human-readable notes about specific risks (concatenated with `\n`). */
  risk_notes: string;
  /** Numeric risk score (0–100). Higher is safer. */
  risk_score: number;
  /** Letter grade (A–F) derived from `risk_score`. */
  grade: string;
  /** `true` if `risk_score >= 60` (the health threshold). */
  is_healthy: boolean;

  /** Timestamp when this configuration was last scanned/recorded. */
  detected_at: string; // ISO 8601
}

/**
 * An OApp that a user has chosen to monitor.
 * 
 * Retrieved from the `/api/monitored-oapps/` endpoint. Includes the latest
 * health snapshot (if available) via annotations.
 */
export interface MonitoredOApp {
  id: number;
  /** Checksummed address of the monitored contract. */
  contract_address: string;
  /** Human-readable name of the contract. */
  contract_name: string;
  /** Chain identifier (e.g., "ethereum", "arbitrum"). */
  contract_chain: string;
  /** Timestamp when the OApp was added to the user's monitor list. */
  added_at: string; // ISO 8601
  /** Health status from the most recent scan. */
  latest_is_healthy: boolean | null;
  /** Risk score from the most recent scan. */
  latest_risk_score: number | null;
  /** Grade from the most recent scan. */
  latest_grade: string | null;
  /** Remote EID from the most reent scan. */
  latest_remote_eid: number | null;
}

/**
 * An alert channel (e.g., Discord webhook) associated with a user.
 * 
 * Retrieved from the `/api/alert-channels/` endpoint. Used to send
 * notifications when monitored OApps become unhealthy.
 */
export interface AlertChannel {
  id: number;
  /** The type of channel (currently only 'discord' is supported). */
  channel_type: 'discord';
  /** The Discord webhook URL (or email address for future support). */
  identifier: string;
  /** `true` if the webhook has been validated (by sending a test ping). */
  is_verified: boolean;
  /** Timestamp when the channel was created. */
  created_at: string; // ISO 8601
}


// ------------------------ Reports ------------------------
/**
 * Summary statistics for a security report.
 */
export interface ReportSummary {
  /** Total number of OApps scanned. */
  total_oapps: number;
  /** Total number of DVN configurations scanned. */
  total_configs: number;
  /** Number of configurations with `is_healthy === false`. */
  unhealthy: number;
  /** Number of configurations where the contract owner is an EOA. */
  eoa_owner_risk: number;
  /** Number of configurations with proxy admin risks. */
  proxy_admin_risk: number;
  /** Number of configurations with stale oracle feeds. */
  oracle_stale: number;
  /** Number of configurations with a 1-of-1 DVN setup (exposure risk). */
  exposed_1_of_1: number;
  /** Number of configurations where all required DVNs are from the same provider. */
  centralized: number;
  /** Breakdown of configurations by remote EID (key: EID string, value: count). */
  by_remote_eid: Record<string, number>;
}

/**
 * A complete security report generated after a `scan_bridges` run.
 * 
 * Retrieved from the `/api/security-reports/` endpoint. Stored in the
 * Django database with multiple format outputs.
 */
export interface Report {
  id: number;
  /** Timestamp when the report was generated. */
  generated_at: string; // ISO 8601
  /** The full summary statistics. */
  summary: ReportSummary;
  /** Raw JSON data containing all configurations and details. */
  data: any; // Consider replacing `any` with a union of `DVNConfig[]` and the full summary
  /** Generated HTML content for web viewing or HTML download. */
  html_content: string;
  /** Path to the stored PDF file (if generated), or `null`. */
  pdf_file: string | null;
  /** Absolute URL to download the PDF file, or `null`. */
  pdf_url: string | null;
}


// ------------------ UI State & Filters ------------------
/**
 * Filter state for the public monitor page.
 * 
 * Applied as query parameters to the `/api/dvn-configs/` endpoint.
 */
export interface Filters {
  /** Filter by contract chain (empty string = all chains). */
  chain: string;
  /** Filter by health status ('true', 'false', or empty string for all). */
  is_healthy: string; // 'true' | 'false' | ''
  /** Full-text search query (searches contract address and name). */
  search: string;
}