"use client";

import React, { useState, useCallback, useMemo } from 'react';

// --- SVG Icons (for a clean, dependency-free setup) ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-500">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-400">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-400">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const TextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-400">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);


// --- Main Application Component (Next.js Page) ---
export default function VibeGeneratorPage() {
    const [textPrompt, setTextPrompt] = useState('');
    const [images, setImages] = useState([]);
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aestheticOutput, setAestheticOutput] = useState(null);
    const [showCopied, setShowCopied] = useState(false);

    const isInputProvided = useMemo(() => textPrompt.trim() !== '' || images.length > 0 || url.trim() !== '', [textPrompt, images, url]);

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const imageObjects = filesArray.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file),
                file: file
            }));
            setImages(prevImages => [...prevImages, ...imageObjects]);
        }
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500');
        if (e.dataTransfer.files) {
            const filesArray = Array.from(e.dataTransfer.files);
            const imageObjects = filesArray.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file),
                file: file
            }));
            setImages(prevImages => [...prevImages, ...imageObjects]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-indigo-500');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500');
    };

    const removeImage = (indexToRemove) => {
        setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerateVibe = () => {
        if (!isInputProvided) return;
        setIsLoading(true);
        setAestheticOutput(null);

        // --- Mock AI Processing ---
        // In a real Next.js app, this is where you'd call your API route.
        // For example: await fetch('/api/generate-vibe', { ... });
        setTimeout(() => {
            const mockAesthetic = {
                id: "aesthetic_" + Date.now(),
                name: "Generated Vibe: Serene Brutalism",
                palette: {
                    primary: "#4A5568", // slate-600
                    secondary: "#A0AEC0", // slate-400
                    accent: "#38B2AC", // teal-400
                    background: "#1A202C", // slate-900
                    text: "#E2E8F0", // slate-200
                },
                typography: {
                    heading: { family: "'Inter', sans-serif", weight: 800, style: "font-extrabold" },
                    body: { family: "'Roboto Mono', monospace", weight: 400, style: "font-normal" }
                },
                keywords: ["brutalism", "minimalist", "organic", "concrete", "serenity"],
                style_attributes: {
                    corner_radius: "0px",
                    border_style: "1px solid #4A5568",
                    shadow_intensity: 0.1,
                    spacing_scale: 1.2
                },
                css_vars: `
:root {
  --color-primary: #4A5568;
  --color-secondary: #A0AEC0;
  --color-accent: #38B2AC;
  --color-background: #1A202C;
  --color-text: #E2E8F0;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Roboto Mono', monospace;
  --corner-radius: 0px;
  --border-style: 1px solid #4A5568;
}
                `.trim()
            };
            setAestheticOutput(mockAesthetic);
            setIsLoading(false);
        }, 2500);
    };

    const handleCopyCss = () => {
        if (aestheticOutput && navigator.clipboard) {
            navigator.clipboard.writeText(aestheticOutput.css_vars).then(() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            }).catch(err => {
                 console.error('Failed to copy CSS', err);
            });
        }
    };
    
    const handleDownloadJson = () => {
        if (aestheticOutput) {
            const jsonString = JSON.stringify(aestheticOutput, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${aestheticOutput.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen font-sans text-slate-200 flex flex-col antialiased">
            {/* Header */}
            <header className="py-4 px-6 md:px-8 border-b border-slate-800 sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                         <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">VaaS</span>
                         <span className="hidden md:inline-block text-sm text-slate-500">Vibe as a Service</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-800">

                {/* Left Panel: Input */}
                <div className="bg-slate-900 p-6 md:p-8 flex flex-col space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Materialize Your Vibe</h1>
                        <p className="text-slate-400 mt-1">Provide images, text, or a URL to generate a portable aesthetic.</p>
                    </div>

                    {/* Text Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center"><TextIcon /> <span className="ml-2">Text Prompt</span></label>
                        <textarea
                            value={textPrompt}
                            onChange={(e) => setTextPrompt(e.target.value)}
                            placeholder="e.g., 'Wes Anderson meets brutalism', 'A serene Japanese garden in a megacity'"
                            className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                        />
                    </div>

                    {/* Image Input */}
                    <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-300 flex items-center"><ImageIcon /> <span className="ml-2">Images</span></label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            className="relative flex flex-col items-center justify-center w-full h-48 p-4 bg-slate-800 border-2 border-dashed border-slate-700 rounded-md transition-colors duration-300 cursor-pointer"
                        >
                            <UploadIcon />
                            <p className="mt-2 text-sm text-slate-400">
                                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover rounded-md" />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => removeImage(index)} className="w-8 h-8 rounded-full bg-red-600/80 text-white flex items-center justify-center font-bold text-lg hover:bg-red-600 transition-colors">&times;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* URL Input */}
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center"><LinkIcon /> <span className="ml-2">URL (Pinterest, etc.)</span></label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://pinterest.com/board/..."
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                        />
                    </div>


                    {/* Action Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleGenerateVibe}
                            disabled={!isInputProvided || isLoading}
                            className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-lg hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Materializing...
                                </>
                            ) : "Generate Vibe"}
                        </button>
                    </div>
                </div>


                {/* Right Panel: Output */}
                <div className="bg-slate-950/50 p-6 md:p-8 flex flex-col justify-center">
                    {isLoading && (
                        <div className="text-center animate-fade-in">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin-slow border-indigo-400 mx-auto"></div>
                            <h2 className="text-xl font-semibold mt-6 text-white">Analyzing Aesthetic</h2>
                            <p className="text-slate-400 mt-2">Our agents are distilling the essence of your vibe...</p>
                        </div>
                    )}

                    {!isLoading && !aestheticOutput && (
                        <div className="text-center animate-fade-in">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            </div>
                            <h2 className="text-xl font-semibold mt-6 text-white">Aesthetic Output</h2>
                            <p className="text-slate-400 mt-2 max-w-sm mx-auto">Your generated vibe will appear here as a portable, machine-readable asset.</p>
                        </div>
                    )}

                    {aestheticOutput && (
                        <div className="animate-fade-in space-y-8">
                             <div>
                                <h2 className="text-2xl font-bold text-white">{aestheticOutput.name}</h2>
                                <p className="text-slate-400 mt-1">This is the materialized version of your vibe.</p>
                            </div>
                            
                            {/* Palette */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-300">Color Palette</h3>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                    {Object.entries(aestheticOutput.palette).map(([name, hex]) => (
                                        <div key={name} className="flex flex-col items-center group">
                                            <div className="w-16 h-16 rounded-full shadow-lg" style={{ backgroundColor: hex, border: '2px solid #2d3748' }}></div>
                                            <span className="text-xs text-slate-400 mt-2 capitalize">{name}</span>
                                            <span className="text-xs font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">{hex}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             {/* Typography */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-300">Typography</h3>
                                <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                                    <div>
                                        <p style={{fontFamily: aestheticOutput.typography.heading.family}} className={`${aestheticOutput.typography.heading.style} text-3xl text-white`}>Heading Font</p>
                                        <p className="text-sm text-slate-500 font-mono">{aestheticOutput.typography.heading.family}</p>
                                    </div>
                                    <div>
                                        <p style={{fontFamily: aestheticOutput.typography.body.family}} className={`${aestheticOutput.typography.body.style} text-base text-slate-300`}>Body font for paragraphs and longer text.</p>
                                        <p className="text-sm text-slate-500 font-mono">{aestheticOutput.typography.body.family}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Keywords */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-300">Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {aestheticOutput.keywords.map(keyword => (
                                        <span key={keyword} className="px-3 py-1 bg-slate-700 text-slate-200 text-xs font-medium rounded-full">{keyword}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                                <button onClick={handleCopyCss} className="flex-1 flex items-center justify-center py-2.5 px-4 bg-slate-700 text-slate-200 font-semibold rounded-md hover:bg-slate-600 transition-colors duration-200">
                                    <CodeIcon />
                                    <span>{showCopied ? 'Copied!' : 'Copy CSS Variables'}</span>
                                </button>
                                <button onClick={handleDownloadJson} className="flex-1 flex items-center justify-center py-2.5 px-4 bg-slate-800 text-slate-300 font-semibold rounded-md hover:bg-slate-700 transition-colors duration-200">
                                    <DownloadIcon />
                                    <span>Download JSON</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
