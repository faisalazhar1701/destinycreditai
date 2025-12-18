'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Disclaimer() {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  const handleProceed = () => {
    if (accepted) {
      localStorage.setItem('disclaimerAccepted', 'true');
      router.push('/login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 bg-pure-white min-h-screen">
      <h1 className="text-3xl font-bold text-primary-black mb-8 text-center tracking-tight">
        Disclaimer
      </h1>

      <div className="bg-pure-white p-8 rounded-lg mb-8 border border-gray-200 shadow-lg">
        <div className="text-primary-black space-y-4 text-sm leading-relaxed">
          <p>
            <strong>EDUCATIONAL PURPOSES ONLY:</strong> This platform provides educational information about credit and dispute processes. It is not legal advice, financial advice, or credit repair services.
          </p>

          <p>
            <strong>NO GUARANTEED OUTCOMES:</strong> We make no guarantees, warranties, or promises regarding credit score improvements, dispute outcomes, or any specific results.
          </p>

          <p>
            <strong>USER RESPONSIBILITY:</strong> You are solely responsible for all decisions and actions taken based on information provided. You manage your own dispute process and communications with credit bureaus.
          </p>

          <p>
            <strong>NOT LEGAL ADVICE:</strong> This platform does not provide legal advice. Consult with qualified legal professionals for legal matters.
          </p>

          <p>
            <strong>NO ATTORNEY-CLIENT RELATIONSHIP:</strong> Use of this platform does not create any attorney-client relationship or professional service relationship.
          </p>

          <p>
            <strong>COMPLIANCE:</strong> You are responsible for ensuring your actions comply with all applicable laws and regulations, including the Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA).
          </p>

          <p>
            <strong>LIMITATION OF LIABILITY:</strong> We disclaim all liability for any damages, losses, or consequences arising from use of this platform or information provided.
          </p>
        </div>
      </div>

      <div className="flex items-center mb-8">
        <input
          type="checkbox"
          id="accept-terms"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mr-3 h-4 w-4 text-primary-green focus:ring-primary-green border-gray-300 rounded bg-pure-white"
        />
        <label htmlFor="accept-terms" className="text-primary-black leading-relaxed">
          I have read and accept the terms
        </label>
      </div>

      <div className="text-center">
        <button
          onClick={handleProceed}
          disabled={!accepted}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg tracking-tight ${accepted
              ? 'bg-primary-green hover:bg-green-700 text-pure-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}