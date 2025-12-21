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

export default function CreditVideos() {
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
                    // Show ONLY videos
                    setLinks(linksData.data.filter((l: Resource) => l.visible && l.type === 'VIDEO'));
                }

                // Fetch uploaded files (publicly accessible ones)
                const uploadsRes = await fetch('/api/upload');
                const uploadsData = await uploadsRes.json();
                if (uploadsData.success) {
                    // Show ONLY video files
                    setUploads(uploadsData.data.filter((f: Upload) => f.fileType.includes('video')));
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
                        Credit Videos
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Educational videos to help you understand credit management and dispute strategies.
                    </p>
                    <div className="w-24 h-1 bg-primary-green mx-auto mt-6 rounded-full"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Video Links Section */}
                        {links.length > 0 && (
                            <section>
                                <div className="flex items-center mb-8">
                                    <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-primary-black tracking-tight">Video Guides</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {links.map((link) => (
                                        <div
                                            key={link.id}
                                            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-green transition-all overflow-hidden"
                                        >
                                            <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                                                {link.url.includes('youtube.com') || link.url.includes('youtu.be') ? (
                                                    <iframe
                                                        className="w-full h-full"
                                                        src={link.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                        title={link.title}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                ) : (
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center group-hover:bg-black/5 transition-colors">
                                                        <div className="w-16 h-16 bg-primary-green/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 8l3 3-3 3V8z" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-2 py-1 text-[10px] font-bold rounded bg-blue-100 text-blue-800 uppercase">
                                                        VIDEO
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-primary-black mb-2 group-hover:text-primary-green transition-colors">
                                                    {link.title}
                                                </h3>
                                                {link.description && (
                                                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                                                        {link.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Uploaded Video Files Section */}
                        {uploads.length > 0 && (
                            <section>
                                <div className="flex items-center mb-8">
                                    <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-primary-black tracking-tight">Recorded Sessions</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {uploads.map((file) => (
                                        <div
                                            key={file.id}
                                            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-green transition-all overflow-hidden"
                                        >
                                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                                <video
                                                    src={file.filepath}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-lg font-bold text-primary-black mb-1 line-clamp-2 leading-tight group-hover:text-primary-green transition-colors">
                                                    {file.filename}
                                                </h3>
                                                <p className="text-gray-400 text-xs mt-2">
                                                    Added on {new Date(file.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {!links.length && !uploads.length && (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 text-lg">No credit videos available at the moment.</p>
                                <p className="text-gray-400 text-sm mt-2">Please check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
