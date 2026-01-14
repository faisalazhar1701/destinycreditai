'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                    setName(data.user.name || '');
                    setEmail(data.user.email || '');
                } else {
                    router.push('/login');
                }
            }
        };
        fetchUser();
    }, [router]);

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, role: user.role, active: true }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Account updated successfully!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update account' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!confirm('Are you sure you want to unsubscribe? You will lose access to premium features.')) {
            return;
        }
        
        setUnsubscribeLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            const res = await fetch('/api/users/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: 'success', text: 'Successfully unsubscribed from service' });
                // Update local user state
                setUser({ ...user, subscribed: false });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to unsubscribe' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setUnsubscribeLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 tracking-tight">Account Settings</h1>

            {message.text && (
                <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-tight">Profile Information</h2>
                <form onSubmit={handleUpdateAccount} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-green focus:border-primary-green outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-green focus:border-primary-green outline-none transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-green hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-tight">Subscription</h2>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-gray-700">Cancel your subscription</p>
                        <p className="text-sm text-gray-500">Unsubscribe from premium services and features.</p>
                    </div>
                    <button
                        onClick={handleUnsubscribe}
                        disabled={unsubscribeLoading || (user && user.subscribed === false)}
                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 font-medium"
                    >
                        {unsubscribeLoading ? 'Processing...' : (user && user.subscribed === false ? 'Already Unsubscribed' : 'Unsubscribe')}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-tight">Security</h2>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-gray-700">Sign out of your account</p>
                        <p className="text-sm text-gray-500">End your current session securely.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
