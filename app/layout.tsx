import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Destiny Credit AI",
  description: "Credit education and financial guidance platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-pure-white text-primary-black">
        <nav className="bg-pure-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 sm:gap-0 sm:h-16 py-4 sm:py-0">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.jpg"
                  alt="Destiny Credit AI"
                  width={120}
                  height={40}
                  priority
                />
                <span className="text-primary-black text-xl font-semibold tracking-tight">
                  Destiny Credit AI
                </span>
              </Link>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <a href="/" className="text-primary-black hover:text-primary-green transition-colors font-medium">
                  Home
                </a>
                <a href="/dashboard" className="text-primary-black hover:text-primary-green transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/credit-videos" className="text-primary-black hover:text-primary-green transition-colors font-medium">
                  Credit Videos
                </a>
                <a href="/resources" className="text-primary-black hover:text-primary-green transition-colors font-medium">
                  Resources
                </a>
                <a href="/admin" className="text-primary-black hover:text-primary-green transition-colors font-medium">
                  Admin
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-pure-white min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
