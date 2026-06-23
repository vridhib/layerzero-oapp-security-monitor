'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '../ProtectedRoute';
import { validateDiscordWebhook } from '@/utils/validation';
import { AlertTriangle, ArrowLeft, Bell, LinkIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AlertChannel } from "@/types/index"


/**
 * Settings page for managing user alert channels.
 *
 * Allows authenticated users to add and remove alert channels (currently 
 * only supports Discord webhooks). Each channel is stored in the Django 
 * backend and is associated with the user.
 *
 * Renders a page with:
 * - A form to add a new alert channel.
 * - A list of all configured channels with their type, URL, and verification 
 *   status.
 * - A delete button to remove channels with a confirmation prompt.
 * - Error handling with user-friendly messages.
 *
 * Channels are used by the scanning system to send alerts when monitored
 * OApps become unhealthy.
 *
 * @component
 * @requires ProtectedRoute - Ensures only authenticated users can access.
 * @returns The rendered settings page.
 *
 * @see {@link UserDashboard} for the main dashboard linking to this page.
 * @see {@link ProtectedRoute} for authentication enforcement.
 */
export default function Settings() {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelType, setChannelType] = useState<'discord'>('discord');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    setError('');
  }, [identifier]);

  const fetchChannels = async () => {
    try {
      const res = await api.get<{ results: AlertChannel[] }>('/alert-channels/');
      setChannels(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleAdd = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');

    // Validate based on channel type
    let validationError = null;
    if (channelType === 'discord') {
      validationError = validateDiscordWebhook(identifier)
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setAdding(true);
    try {
      await api.post('/alert-channels/', { channel_type: channelType, identifier });
      setIdentifier('');
      await fetchChannels();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add channel');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this alert channel?')) return;
    setRemovingId(id);

    try {
      await api.delete(`/alert-channels/${id}/`);
      setChannels(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

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
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 mt-12">
            <Link
              href="/user-dashboard" 
              className="p-2 rounded-lg hover:bg-indigo-800/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-indigo-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bell className="text-violet-400" size={28} />
                Alert Settings
              </h1>
              <p className="text-indigo-300 mt-1 text-sm">
                Configure where you receive security alerts
              </p>
            </div>
          </div>

          {/* Add Form */}
          <div className="relative bg-indigo-900/60 backdrop-blur-sm border border-indigo-700/50 rounded-2xl p-6 mb-8">
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-violet-400" />
              Add Alert Channel
            </h2>

            {error && (
              <div className="bg-red-900/40 border border-red-700/50 text-red-200 p-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                    Channel Type
                  </label>
                  <select
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value as 'discord')}
                    className="w-full px-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="discord" className="bg-indigo-900">Discord Webhook</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                    Webhook URL <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
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
                    'Add Channel'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Channel List */}
          {channels.length === 0 ? (
            <div className="text-center py-12 bg-indigo-900/30 border border-indigo-700/50 rounded-2xl">
              <Bell className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
              <p className="text-indigo-300">No alert channels configured.</p>
              <p className="text-indigo-400 text-sm mt-1">Add a Discord webhook above to receive alerts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex flex-wrap items-center justify-between gap-4 bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4 hover:bg-indigo-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-800/50">
                      <Bell className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-700/50 text-indigo-200 text-xs font-medium">
                        {ch.channel_type}
                      </span>
                      <p className="text-sm text-indigo-300 truncate mt-1 font-mono">
                        {ch.identifier}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!ch.is_verified && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        unverified
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(ch.id)}
                      disabled={removingId === ch.id}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      {removingId === ch.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}