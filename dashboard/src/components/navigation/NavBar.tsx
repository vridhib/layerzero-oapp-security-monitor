'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleUserRound, LayoutDashboard, Settings, LogOut, PlusCircle, LogIn, Activity, FileText } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/context/AuthContext';


/**
 * Main navigation bar for the LayerZero OApp Configuration Monitor.
 * 
 * Renders a responsive header with:
 * - The application logo (DVN Monitor) with an Activity icon.
 * - Public links: "Suggest OApp" and "View Reports".
 * - Authentication controls: 
 *   - For unauthenticated users: Login/Register buttons.
 *   - For authenticated users: a user dropdown with avatar, dashboard link, settings 
 *     link, and logout functionality.
 * 
 * The user's authentication state and profile data are derived from the {@link useAuth} 
 * context. The dropdown displays the user's username and email using custom JWT claims 
 * (`username`, `email`).
 * 
 * @component
 * @requires useAuth - Authentication context for login state, user data, and logout.
 * @requires useRouter - Next.js navigation for logout redirect.
 * @returns The rendered navigation bar.
 * 
 * @see {@link useAuth} for the authentication context.
 * @see {@link UserDashboard} for the user's monitored OApps.
 * @see {@link Settings} for alert channel configuration.
 */
export function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-indigo-900/80 backdrop-blur-sm border-b border-indigo-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold text-white hover:text-violet-300 transition-colors duration-200">
        <Activity className="h-6 w-6 text-violet-400" />
        <span className="tracking-tight">LayerZero OApp Security Monitor</span>
      </Link>

      {/* Public Links & Avatar Dropdown */}
      <div className="flex items-center gap-3">
        <Link
          href="/public-add-oapp"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/50 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-400 transition-all duration-200 text-sm font-medium"
        >
          <PlusCircle className="h-4 w-4" />
          Suggest OApp
        </Link>
        <Link
          href="/security-reports"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 transition-all duration-200 text-sm font-medium"
        >
          <FileText className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">View Reports</span>
        </Link>

        {!isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 transition-all duration-200 text-sm font-medium"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Link
              href="/register"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all duration-200 text-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded-full hover:ring-2 hover:ring-violet-400 hover:ring-offset-2 hover:ring-offset-indigo-900 transition-all duration-200"
                aria-label="User menu"
              >
                <CircleUserRound className="h-9 w-9 text-white bg-indigo-700 rounded-full p-1.5 hover:bg-indigo-600 transition-colors" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[240px] bg-indigo-800/95 backdrop-blur-sm border border-indigo-700 rounded-xl shadow-2xl p-2 text-white z-50"
                sideOffset={8}
                align="end"
              >
                <div className="px-3 py-2 border-b border-indigo-700/50 mb-1">
                  <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                  <p className="text-xs text-indigo-300">{user?.email}</p>
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/user-dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-700/50 cursor-pointer transition-colors duration-150 text-sm"
                  >
                    <LayoutDashboard className="h-4 w-4 text-violet-400" />
                    My OApps
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-700/50 cursor-pointer transition-colors duration-150 text-sm"
                  >
                    <Settings className="h-4 w-4 text-violet-400" />
                    Alert Channels
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 h-px bg-indigo-700/50" />

                <DropdownMenu.Item
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-900/40 cursor-pointer text-red-300 hover:text-red-200 transition-colors duration-150 text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </nav>
  );
}