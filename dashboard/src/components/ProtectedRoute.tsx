'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


/**
 * Wrapper component that enforces authentication for protected pages.
 *
 * On mount, it checks `localStorage` for the presence of an `access_token`.
 * If the token is missing, the user is immediately redirected to the `/login`
 * page. If the token exists, the child components are rendered.
 *
 * While the authorization check is in progress (i.e., before `isAuthorized`
 * is set), a loading indicator is displayed to prevent flash of protected
 * content or redirect loops.
 *
 * @component
 * @param children - The React nodes to render if the user is authenticated.
 * @returns The rendered children or a loading indicator.
 *
 * @example
 * // Wrap a page or layout:
 * <ProtectedRoute>
 *   <UserDashboard />
 * </ProtectedRoute>
 *
 * @see {@link Login} for the login page.
 * @see {@link useAuth} for the authentication context.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  return <>{children}</>;
}