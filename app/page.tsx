import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-20 bg-pure-white min-h-screen">
      <h1 className="text-4xl md:text-5xl font-bold text-primary-black mb-6 tracking-tight leading-relaxed">
        Welcome to Destiny Credit AI
      </h1>

      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
        AI-powered credit education & dispute letter platform
      </p>

      <Link href="/disclaimer">
        <button className="bg-primary-green hover:bg-green-700 text-pure-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors mb-12 shadow-lg tracking-tight">
          Get Started
        </button>
      </Link>

      <div className="border-t border-gray-200 pt-8">
        <p className="text-gray-500 text-sm font-medium leading-relaxed">
          No legal advice. No guaranteed outcomes.
        </p>
      </div>
    </div>
  );
}
