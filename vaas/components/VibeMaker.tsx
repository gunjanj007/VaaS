"use client";

import { useState, ChangeEvent, DragEvent } from "react";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5050";

export default function VibeMaker() {
  const [textsRaw, setTextsRaw] = useState("");
  const [urlsRaw, setUrlsRaw] = useState("");
  interface UploadedImg {
    name: string;
    url: string; // object URL for preview
    base64: string; // data URL for backend
  }

  const [images, setImages] = useState<UploadedImg[]>([]);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: any = {};

      if (!name.trim()) {
        setError("Please provide an embedding name.");
        setLoading(false);
        return;
      }

      console.log("[VibeMaker] Sending /api/mood", body);
      const texts = textsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const urls = urlsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (texts.length) body.texts = texts;
      if (urls.length) body.urls = urls;
      if (images.length) body.images = images.map((i) => i.base64);
      body.name = name.trim();

      if (!body.texts && !body.urls && !body.images) {
        setError("Please provide at least one text, image or URL.");
        setLoading(false);
        return;
      }

      const resp = await fetch(`${BACKEND}/api/mood`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || "Failed to generate");
      }

      const data = await resp.json();
      setResult(data.aesthetic_embedding ?? "");
      console.log("[VibeMaker] Success", data);

      // Inform other components that a new vibe was saved
      window.dispatchEvent(
        new CustomEvent("vibe-saved", { detail: { name: body.name } })
      );
      setSuccessMsg("Vibe saved ✓");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function filesToImages(files: FileList | File[]) {
    const arr = Array.from(files);
    const mapped = await Promise.all(
      arr.map(
        (file) =>
          new Promise<UploadedImg>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                url: URL.createObjectURL(file),
                base64: reader.result as string,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
    setImages((prev) => [...prev, ...mapped]);
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      await filesToImages(e.target.files);
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-indigo-500");
    if (e.dataTransfer.files) {
      await filesToImages(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-indigo-500");
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-indigo-500");
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold">Vibe Maker</h1>

      <label className="flex flex-col gap-1">
        <span className="font-medium">Texts (one per line)</span>
        <textarea
          className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none text-slate-200 placeholder-slate-500"
          value={textsRaw}
          onChange={(e) => setTextsRaw(e.target.value)}
          placeholder="e.g. A warm minimal coffee shop with earth tones"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">URLs to sample (one per line)</span>
        <textarea
          className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none text-slate-200 placeholder-slate-500"
          value={urlsRaw}
          onChange={(e) => setUrlsRaw(e.target.value)}
          placeholder="e.g. https://dribbble.com/shots/1234567-awesome-design"
        />
      </label>

      {/* Image upload area */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
          {/* inline svg same as UploadIcon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-slate-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Images
        </span>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className="relative flex flex-col items-center justify-center w-full h-48 p-4 bg-slate-800 border-2 border-dashed border-slate-700 rounded-md transition-colors duration-300 cursor-pointer"
        >
          {/* Upload icon big */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-slate-500"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeImage(index)}
                    className="w-8 h-8 rounded-full bg-red-600/80 text-white flex items-center justify-center font-bold text-lg hover:bg-red-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-medium">Embedding name</span>
        <input
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-slate-200 placeholder-slate-500"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. warm-earthy-minimal"
        />
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-lg hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          "Generate Vibe"
        )}
      </button>

      {successMsg && (
        <p className="text-green-400 text-sm mt-2">{successMsg}</p>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {/* No direct embedding textarea shown anymore */}
    </div>
  );
}
