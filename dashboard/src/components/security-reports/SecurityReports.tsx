'use client';
import { useEffect, useState } from 'react';
import {
  Calendar, FileJson, FileText, File, AlertTriangle, ShieldAlert, Server, Users, Database
} from 'lucide-react';
import api from '@/lib/api';
import type { Report } from '@/types/index'
import { DownloadDropdown } from './DownloadDropdown';
import { StatCard } from './StatCard';

/**
 * Security reports page for the LayerZero OApp Configuration Monitor.
 *
 * Displays a list of generated security reports, with the most recent report
 * highlighted at the top. Each report includes:
 * - A summary of total OApps scanned, unhealthy configs, EOA owner risks,
 *   1-of-1 DVN exposures, and per-chain/remote EID breakdowns.
 * - A download dropdown for JSON, HTML, and PDF formats.
 * - A table of all past reports with individual download buttons.
 *
 * Reports are generated automatically after the `scan_bridges` command is run 
 * and stored in the Django database. The page fetches reports via 
 * `/api/security-reports/`.
 *
 * @component
 * @returns The rendered security reports page.
 *
 * @see {@link DownloadDropdown} for the format selection UI.
 * @see {@link StatCard} for the summary statistic cards.
 */
export default function SecurityReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get<{ results: Report[] }>('/security-reports/');
      setReports(response.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;

  // Download helper for any report
  const downloadReport = (report: Report, format: 'json' | 'html' | 'pdf') => {
    if (format === 'json') {
      // Download the full report data as JSON
      const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oapp_security_report_${report.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    else if (format === 'html') {
      // Download html_content as .html file
      const blob = new Blob([report.html_content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oapp_security_report_${report.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    else if (format === 'pdf') {
      // PDF is stored as a file, open the URL or download via fetch
      if (report.pdf_url) window.open(report.pdf_url, '_blank');
    }
  };


  // Render UI
  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="text-indigo-300 animate-pulse">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-950 p-8 text-red-400">
        <AlertTriangle className="inline mr-2" />
        Error: {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-indigo-950 text-white p-4">
      <div className="container mx-auto mt-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="text-violet-400" size={32} />
              Security Reports
            </h1>
            <p className="text-indigo-300 mt-1">
              Automated LayerZero OApp security scans
            </p>
          </div>
          {latestReport && (
            <div className="flex items-center text-sm text-indigo-300 bg-indigo-800/50 px-4 py-2 rounded-lg border border-indigo-700">
              <Calendar size={16} className="mr-2 text-violet-400" />
              Last scanned: {new Date(latestReport.generated_at).toLocaleString()}
            </div>
          )}
        </div>

        {!latestReport ? (
          <div className="bg-amber-900/30 border border-amber-700 text-amber-200 p-6 rounded-xl text-center">
            <Database className="mx-auto mb-2" size={32} />
            <p className="text-lg font-medium">No reports available</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 mb-8">
              <StatCard
                label="OApps Scanned"
                value={latestReport.summary.total_oapps}
                icon={<Server className="text-violet-400" size={20} />}
                bg="bg-indigo-800/50"
                border="border-indigo-700"
                text="text-white"
              />
              <StatCard
                label="Unhealthy Configs"
                value={latestReport.summary.unhealthy}
                icon={<AlertTriangle className="text-red-400" size={20} />}
                bg="bg-red-900/30"
                border="border-red-700"
                text="text-red-200"
              />
              <StatCard
                label="EOA Owner Risks"
                value={latestReport.summary.eoa_owner_risk}
                icon={<Users className="text-amber-400" size={20} />}
                bg="bg-amber-900/30"
                border="border-amber-700"
                text="text-amber-200"
              />
              <StatCard
                label="1-of-1 DVN Exposures"
                value={latestReport.summary.exposed_1_of_1}
                icon={<ShieldAlert className="text-red-400" size={20} />}
                bg="bg-red-900/30"
                border="border-red-700"
                text="text-red-200"
              />
            </div>

            {/* Latest Report Actions */}
            <div className="bg-indigo-900/30 rounded-xl border border-indigo-700 p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Latest Report</h2>
                  <p className="text-sm text-indigo-300">
                    Generated {new Date(latestReport.generated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DownloadDropdown
                    onDownload={(format) => downloadReport(latestReport, format)}
                  />
                </div>
              </div>
              {/* Remote EID badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(latestReport.summary.by_remote_eid).map(([eid, count]) => (
                  <span
                    key={eid}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-700/50 text-indigo-200 border border-indigo-600"
                  >
                    EID {eid}: {count} configs
                  </span>
                ))}
              </div>
            </div>

            {/* Past Reports Table */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <File className="text-violet-400" size={20} />
                Past Reports
              </h2>
              <div className="bg-indigo-900/30 rounded-xl border border-indigo-700 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-indigo-800/50">
                    <tr className="uppercase tracking-wider text-indigo-300 text-xs">
                      <th className="p-3 text-left">Report ID</th>
                      <th className="p-3 text-left">Generated At</th>
                      <th className="p-3 text-left">Unhealthy</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-800/50">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-indigo-800/30 transition">
                        <td className="p-3 text-sm font-medium text-white">#{report.id}</td>
                        <td className="p-3 text-sm text-indigo-300">
                          {new Date(report.generated_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`font-medium ${report.summary.unhealthy > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {report.summary.unhealthy}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadReport(report, 'json')}
                              className="p-1.5 rounded hover:bg-indigo-700/50 text-indigo-300 transition"
                              title="Download JSON"
                            >
                              <FileJson size={18} />
                            </button>
                            <button
                              onClick={() => downloadReport(report, 'html')}
                              className="p-1.5 rounded hover:bg-indigo-700/50 text-indigo-300 transition"
                              title="Download HTML"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => downloadReport(report, 'pdf')}
                              className="p-1.5 rounded hover:bg-indigo-700/50 text-indigo-300 transition"
                              title="Download PDF"
                            >
                              <File size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}