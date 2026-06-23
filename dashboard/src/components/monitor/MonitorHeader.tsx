import { Shield } from "lucide-react";

/**
 * Displays a header for the Monitor page.
 * 
 * Renders a page header with an icon, title, and description.
 * 
 * @component
 * @returns The rendered public monitor header. 
 */
export function MonitorHeader() {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold flex items-center gap-3 mt-8 mb-2">
        <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
          <Shield className="h-7 w-7 text-violet-400" />
        </div>
        LayerZero OApp Security Monitor
      </h1>
      <p className="text-indigo-300 text-sm">
        Monitor LayerZero OApp security configurations across all chains
      </p>
    </div>
  );
}