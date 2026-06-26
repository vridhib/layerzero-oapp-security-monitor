'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { isAddress } from 'viem';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { toTitleCase } from '@/utils/helperFunctions';
import { AlertTriangle, CheckCircle, Globe, Hash, Loader2, PlusCircle, Shield } from 'lucide-react';


/**
 * Public page for suggesting a LayerZero OApp to be monitored.
 * 
 * Allows unauthenticated users to submit an OApp contract address, 
 * chain, and optional name to be included in the set of BridgeContract 
 * objects for scanning. The submission is:
 * - Rate-limited to 10 requests per IP per hour (enforced by the backend).
 * - Validated for address format
 * - Added to the `BridgeContract` table and marked as `source=user`. 
 * 
 * On successful submission, a success message is displayed and the user is 
 * redirected to the home page after a short delay. Errors are displayed 
 * inline with descriptive messages. 
 * 
 * @component
 * @requires useRouter - Next.js navigation for redirect after submission.
 * @returns The rendered "Suggest OApp" page.
 *
 * @see {@link SUPPORTED_CHAINS} for the list of supported chains.
 * @see {@link toTitleCase} for formatting chain names.
 */
export default function PublicAddOApp() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  useEffect(() => {
    if (message && message.type == 'error') {
      setMessage(null);
    }
  }, [address]);

  
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isAddress(address)) {
      setMessage({ type: 'error', text: 'Invalid Ethereum address' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/public/add-oapp/', { address, chain, name });
      setMessage({ type: 'success', text: 'OApp added successfully! It will be scanned soon.' });
      setAddress('');
      setName('');
    }
    catch (err: any) {
      if (err.response?.status === 429) {
        setMessage({ type: 'error', text: 'Too many submissions from this IP. Try again later.' });
      } 
      else {
        const data = err.response?.data;
        const errorMessage = data?.address?.[0] || 'Failed to add OApp';
        setMessage({ type: 'error', text: errorMessage });
      }
    }
    finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Card with Subtle Glow */}
        <div className="relative bg-indigo-900/60 backdrop-blur-sm border border-indigo-700/50 rounded-2xl shadow-2xl shadow-indigo-900/30 p-8">
          {/* Decorative Top Accent */}
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
              <PlusCircle className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Suggest an OApp</h2>
            <p className="text-indigo-300 text-sm mt-1">
              Submit a LayerZero OApp to be scanned for security risks
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-900/40 border border-green-700/50 text-green-200' 
                  : 'bg-red-900/40 border border-red-700/50 text-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Contract Address <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 font-mono"
                  required
                />
              </div>
              <p className="text-indigo-400 text-xs mt-1.5">Enter the full Ethereum address (0x...)</p>
            </div>

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Chain <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                >
                  {SUPPORTED_CHAINS.map(c => (
                    <option key={c} value={c} className="bg-indigo-900">
                      {toTitleCase(c)}
                    </option>
                  ))}
                </select>
                {/* Custom Dropdown Arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-indigo-200 text-xs font-semibold tracking-wider uppercase mb-1.5">
                Name <span className="text-indigo-400">(optional)</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My OApp"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit OApp'
              )}
            </button>
          </form>

          <p className="text-center text-indigo-400 text-xs mt-6">
            Rate limited to 10 submissions per IP per hour.
          </p>
        </div>
      </div>
    </div>
  );
}