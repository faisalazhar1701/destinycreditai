'use client';

import { useState, useEffect } from 'react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type?: string;
  description?: string;
  visible: boolean;
}

interface Upload {
  id: string;
  filename: string;
  filepath: string;
  fileType: string;
  createdAt: string;
}

export default function Resources() {
  const [links, setLinks] = useState<Resource[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch external links - now using public endpoint
        const linksRes = await fetch('/api/admin/resources?public=true');
        const linksData = await linksRes.json();
        if (linksData.success) {
          // Filter out videos
          setLinks(linksData.data.filter((l: Resource) => l.visible && l.type !== 'VIDEO'));
        }

        // Fetch uploaded files (publicly accessible ones)
        const uploadsRes = await fetch('/api/upload');
        const uploadsData = await uploadsRes.json();
        if (uploadsData.success) {
          // Filter out video files
          setUploads(uploadsData.data.filter((f: Upload) => !f.fileType.includes('video')));
        }
      } catch (e) {
        console.error('Failed to fetch resources', e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <div className="py-12 bg-pure-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary-black mb-4 tracking-tight">
            Resource Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your comprehensive educational library for credit management and dispute strategies.
          </p>
          <div className="w-24 h-1 bg-primary-green mx-auto mt-6 rounded-full"></div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* External Links Section */}
            {links.length > 0 && (
              <section>
                <div className="flex items-center mb-8">
                  <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-primary-black tracking-tight">Educational Links</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-green transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-800 uppercase">
                          {link.type || 'Resource'}
                        </span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-primary-black mb-2 group-hover:text-primary-green transition-colors">
                        {link.title}
                      </h3>
                      {link.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                          {link.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Uploaded Files Section */}
            {uploads.length > 0 && (
              <section>
                <div className="flex items-center mb-8">
                  <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-primary-black tracking-tight">Learning Materials</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uploads.map((file) => (
                    <a
                      key={file.id}
                      href={file.filepath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-green transition-all"
                    >
                      <div className="mb-4">
                        {file.fileType.includes('pdf') ? (
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-700 font-bold text-xs">PDF</span>
                          </div>
                        ) : file.fileType.includes('video') ? (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                              <path d="M10 8l3 3-3 3V8z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-700 font-bold text-xs">DOC</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-primary-black mb-1 line-clamp-2 leading-tight group-hover:text-primary-green transition-colors">
                        {file.filename}
                      </h3>
                      <p className="text-gray-400 text-xs mt-2">
                        Added on {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {!links.length && !uploads.length && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-lg">No resources available at the moment.</p>
                <p className="text-gray-400 text-sm mt-2">Please check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}