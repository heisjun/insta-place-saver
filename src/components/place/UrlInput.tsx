"use client";

import { FormEvent, useState } from "react";

interface Props {
  initialUrl?: string;
  onSubmit: (url: string) => void;
  loading?: boolean;
}

export default function UrlInput({ initialUrl = "", onSubmit, loading }: Props) {
  const [url, setUrl] = useState(initialUrl);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">
        인스타그램 게시글 URL
      </label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.instagram.com/p/..."
        disabled={loading}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />
      <button
        type="submit"
        disabled={!url.trim() || loading}
        className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition-opacity disabled:opacity-40"
      >
        {loading ? "분석 중..." : "가게 찾기"}
      </button>
    </form>
  );
}
