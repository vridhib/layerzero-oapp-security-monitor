'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '../ProtectedRoute';
import { AlertTriangle, Globe, Hash, Loader2, PlusCircle, Search, Settings, Shield, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { HealthBadge } from './HealthBadge';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { toTitleCase } from '@/utils/helperFunctions';
import { MonitoredOApp } from '@/types';


/**
 * User dashboard for managing monitored OApps.
 *
 * Allows authenticated users to add LayerZero OApps to their personal monitor
 * list, remove existing entries, and filter their list by chain. Each entry
 * displays the contract name, address, chain, health status (via
 * {@link HealthBadge}), and the date added.
 *
 * On add, the contract is either retrieved from the local database (if it
 * exists) or created via the Django backend. The user is associated with the
 * monitored OApp via the `/api/monitored-oapps/` endpoint.
 *
 * @component
 * @requires ProtectedRoute ensures only authenticated users can access.
 * @returns The rendered user dashboard.
 *
 * @see {@link HealthBadge} for the health indicator.
 * @see {@link Settings} for alert channel configuration.
 */
export default function UserDashboard() {
  const [monitoredOapps, setMonitoredOapps] = useState<MonitoredOApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [filterChain, setFilterChain] = useState('all');

  useEffect(() => {
    fetchMonitered();
  }, []);

  useEffect(() => {
    setError('')
  }, [address, name, chain]);


  // Fetch user's monitored OApps
  const fetchMonitered = async () => {
    try {
      const response = await api.get<{ results: MonitoredOApp[] }>('/monitored-oapps/');
      setMonitoredOapps(response.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Handle user adding new OApps to monitor
  const handleAdd = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      await api.post('/monitored-oapps/', { address, chain, name });
      setAddress('');
      setName('');
      await fetchMonitered();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add OApp');
    } finally {
      setAdding(false);
    }
  };

  // Handle user deleting OApps to monitor
  const handleRemove = async (id: number) => {
    if (!confirm('Remove this OApp from your monitor list?')) return;
    setRemovingId(id);

    try {
      await api.delete(`/monitored-oapps/${id}/`);
      setMonitoredOapps(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };


  const filteredOapps = filterChain === 'all'
    ? monitoredOapps
    : monitoredOapps.filter(o => o.contract_chain === filterChain);

  // Render UI
  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-indigo-950 text-white p-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between mb-8 mt-12">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="text-violet-400" size={28} />
                My Monitored OApps
              </h1>
              <p className="text-indigo-300 mt-1 text-sm">
                Track health and security risks for your LayerZero OApps
              </p>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 border border-indigo-700/50 transition-colors"
            >
              <Settings size={18} className="text-violet-400" />
              <span className="hidden sm:inline text-sm">Settings</span>
            </Link>
          </div>

          {/* Add Form */}
          <div className="relative bg-indigo-900/60 backdrop-blur-sm border border-indigo-700/50 rounded-2xl p-6 mb-8">
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-violet-400" />
              Add OApp to Monitor
            </h2>

            {error && (
              <div className="bg-red-900/40 border border-red-700/50 text-red-200 p-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Contract address *"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                    required
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <select
                    value={chain}
                    onChange={(e) => setChain(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {SUPPORTED_CHAINS.map(c => (
                      <option key={c} value={c} className="bg-indigo-900">{toTitleCase(c)}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adding}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {adding ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add OApp'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-400" />
              <select
                value={filterChain}
                onChange={(e) => setFilterChain(e.target.value)}
                className="bg-indigo-800/50 border border-indigo-700/50 text-white p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              >
                <option value="all">All Chains</option>
                {SUPPORTED_CHAINS.map(c => (
                  <option key={c} value={c} className="bg-indigo-900">{toTitleCase(c)}</option>
                ))}
              </select>
              {filterChain !== 'all' && (
                <button
                  onClick={() => setFilterChain('all')}
                  className="text-indigo-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-indigo-300">
              {filteredOapps.length} {filteredOapps.length === 1 ? 'OApp' : 'OApps'} monitored
            </div>
          </div>

          {/* Table */}
          {filteredOapps.length === 0 ? (
            <div className="text-center py-12 bg-indigo-900/30 border border-indigo-700/50 rounded-2xl">
              <Shield className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
              <p className="text-indigo-300">No monitored OApps match the filter.</p>
              <p className="text-indigo-400 text-sm mt-1">Add an OApp above to start monitoring.</p>
            </div>
          ) : (
            <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-indigo-800/50">
                    <tr className="uppercase tracking-wider text-indigo-300 text-xs">
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Address</th>
                      <th className="p-3 text-left">Remote EID</th>
                      <th className="p-3 text-left">Chain</th>
                      <th className="p-3 text-left">Health</th>
                      <th className="p-3 text-left">Added</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-800/50">
                    {filteredOapps.map((o) => (
                      <tr key={o.id} className="hover:bg-indigo-800/30 transition-colors">
                        {/* Contract Name */}
                        <td className="p-3 text-sm font-medium">
                          {o.contract_name || <span className="text-indigo-400">—</span>}
                        </td>
                        {/* Contract Address */}
                        <td className="p-3 font-mono text-xs text-indigo-300">
                          {o.contract_address}
                        </td>
                        {/* Remote EID */}
                        <td className="p-3 text-sm text-indigo-300">
                          {o.latest_remote_eid || '—'}
                        </td>
                        {/* Contract Chain */}
                        <td className="p-3 text-sm">
                          <span className="px-2 py-1 rounded-full bg-indigo-700/30 text-indigo-300 text-xs">
                            {toTitleCase(o.contract_chain)}
                          </span>
                        </td>
                        {/* Contract Health */}
                        <td className="p-3">
                          <HealthBadge
                            isHealthy={o.latest_is_healthy}
                            riskScore={o.latest_risk_score}
                          />
                        </td>
                        {/* Added At */}
                        <td className="p-3 text-sm text-indigo-300">
                          {new Date(o.added_at).toLocaleDateString()}
                        </td>
                        {/* Remove Button */}
                        <td className="p-3">
                          <button
                            onClick={() => handleRemove(o.id)}
                            disabled={removingId === o.id}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            {removingId === o.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}