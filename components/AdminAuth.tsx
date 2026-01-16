'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminAuthProps {
  children: React.ReactNode;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'ADMIN') {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Auth check failed', err);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user && data.user.role === 'ADMIN') {
          setIsAuthenticated(true);
          setError('');
        } else {
          setError('Access denied. Admin role required.');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setCredentials({ email: '', password: '' });
    router.push('/login');
  };

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pure-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pure-white px-4">
        <div className="max-w-md w-full space-y-8 bg-pure-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div>
            <h2 className="text-center text-3xl font-bold text-primary-black tracking-tight">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 leading-relaxed">
              Secure access for platform administrators
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-black mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 bg-pure-white text-primary-black transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-black mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 bg-pure-white text-primary-black transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                <p className="text-red-800 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-primary-green hover:bg-green-700 text-pure-white py-3 px-4 rounded-lg font-bold transition-all tracking-tight shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-pure-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-primary-black tracking-tight">Admin Panel</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-pure-white px-4 py-2 rounded-lg font-medium transition-colors tracking-tight"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}