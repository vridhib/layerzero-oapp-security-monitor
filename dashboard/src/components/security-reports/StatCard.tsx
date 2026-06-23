interface StatCardProps {
  /** The display label (e.g., "OApps Scanned"). */
  label: string;
  /** The numerical value to display. */
  value: number;
  /** A Lucide React icon element (e.g., `<Server className="..." />`). */
  icon: React.ReactNode;
  /** Tailwind background class (e.g., "bg-indigo-800/50"). */
  bg: string;
  /** Tailwind border class (e.g., "border-indigo-700"). */
  border: string;
  /** Tailwind text color class (e.g., "text-white"). */
  text: string;
}

/**
 * A reusable statistic card that displays a numerical value with an icon and label.
 *
 * Used in the {@link SecurityReports} page to show key metrics such as:
 * - Total OApps scanned.
 * - Number of unhealthy configurations.
 * - EOA owner risks.
 * - 1-of-1 DVN exposures.
 *
 * The card applies the provided Tailwind classes for background, border, and
 * text color, making it highly customizable while maintaining a consistent layout.
 *
 * @component
 * @param props - The {@link StatCardProps} object.
 * @returns The rendered statistic card.
 *
 * @example
 * <StatCard
 *   label="OApps Scanned"
 *   value={150}
 *   icon={<Server className="text-violet-400" size={20} />}
 *   bg="bg-indigo-800/50"
 *   border="border-indigo-700"
 *   text="text-white"
 * />
 *
 * @see {@link SecurityReports} for the parent page.
 */
export function StatCard({ 
  label, 
  value, 
  icon, 
  bg, 
  border, 
  text 
}: StatCardProps
) {
  return (
    <div className={`${bg} p-4 rounded-xl border ${border} flex items-center gap-3`}>
      {icon}
      <div>
        <div className={`text-2xl font-bold ${text}`}>{value}</div>
        <div className="text-xs uppercase tracking-wider text-indigo-300">{label}</div>
      </div>
    </div>
  );
}
