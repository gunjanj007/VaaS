"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PreviewPage() {
  const params = useSearchParams();
  const url = params.get("url") ?? "";
  const id = params.get("id") ?? "";

  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("vibe_preview_" + id);
      if (stored) setHtml(stored);
    }
  }, [id]);

  if (!url || !id) {
    return <p className="p-4 text-red-600">Invalid preview link.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
      <iframe src={url} className="w-full h-full border-r" />
      {html ? (
        <iframe
          srcDoc={html}
          sandbox="allow-same-origin"
          className="w-full h-full"
        />
      ) : (
        <p className="p-4">Loading preview...</p>
      )}
    </div>
  );
}
