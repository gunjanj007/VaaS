"use client";

import { useEffect, useState } from "react";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5050";

interface SavedAesthetic {
  name: string;
  embedding: string;
  // other fields ignored
}

export default function VibeTransform() {
  const [url, setUrl] = useState("");
  const [savedList, setSavedList] = useState<SavedAesthetic[]>([]);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlOut, setHtmlOut] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchList = () => {
    console.log("[VibeTransform] Fetching saved aesthetics from", `${BACKEND}/api/aesthetics`);
    fetch(`${BACKEND}/api/aesthetics`)
      .then((r) => (r.ok ? r.json() : Promise.reject("failed")))
      .then((data) => {
        if (data?.data) setSavedList(data.data);
      })
      .catch(() => {});
  };

  // initial load
  useEffect(() => {
    fetchList();
    // listener for new vibe saved
    const handler = () => fetchList();
    window.addEventListener("vibe-saved", handler as EventListener);
    return () => {
      window.removeEventListener("vibe-saved", handler as EventListener);
    };
  }, []);

  function getBody() {
    if (!url.trim()) {
      throw new Error("URL is required");
    }

    const body: any = { url: url.trim() };
    if (!selectedAesthetic) {
      throw new Error("Please select a saved aesthetic first");
    }
    body.aesthetic_name = selectedAesthetic;
    return body;
  }

  async function handleTransform() {
    try {
      setError(null);
      setLoading(true);
      setHtmlOut(null);

      const body = getBody();

      console.log("[VibeTransform] POST /api/transform-url", body);
      const resp = await fetch(`${BACKEND}/api/transform-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || "Failed");
      }

      const data = await resp.json();
      console.log("[VibeTransform] Success", data);
      setHtmlOut(data.html);
      const id = Date.now().toString(36);
      try {
        localStorage.setItem("vibe_preview_" + id, data.html);
        setPreviewId(id);
      } catch {}
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold">Vibe Transform</h1>

      <label className="flex flex-col gap-1">
        <span className="font-medium">Webpage URL</span>
        <input
          type="text"
          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-slate-200 placeholder-slate-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-medium">Saved aesthetics</span>
        {savedList.length === 0 ? (
          <p className="text-sm text-slate-500">No embeddings available.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {savedList.map((a) => {
              const selected = a.name === selectedAesthetic;
              return (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setSelectedAesthetic(a.name)}
                  className={`px-4 py-2 rounded-full border transition-colors text-sm ${selected ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-slate-600 text-slate-300 hover:border-indigo-400 hover:text-indigo-200"}`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={handleTransform}
        disabled={loading || !selectedAesthetic || savedList.length === 0}
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
            Transforming...
          </>
        ) : (
          "Transform"
        )}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {previewId && (
        <div className="mt-6">
          <button
            onClick={() =>
              window.open(
                `/preview?id=${previewId}&url=${encodeURIComponent(url)}`,
                "_blank"
              )
            }
            className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
          >
            Open Preview
          </button>
        </div>
      )}
    </div>
  );
}
