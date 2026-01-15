'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubscriptionCanceledPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleResubscribe = () => {
        setLoading(true);
        // Redirect to the public landing page/checkout
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-pure-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Subscription Canceled
                    </h2>
                    
                    <p className="text-gray-600 mb-8">
                        Your subscription has been canceled. Please resubscribe to regain access to your dashboard and premium features.
                    </p>
                    
                    <div className="space-y-4">
                        <button
                            onClick={handleResubscribe}
                            disabled={loading}
                            className="w-full bg-primary-green hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Redirecting...' : 'Resubscribe Now'}
                        </button>
                        
                        <Link 
                            href="/login"
                            className="block text-center text-primary-green hover:text-green-700 font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}