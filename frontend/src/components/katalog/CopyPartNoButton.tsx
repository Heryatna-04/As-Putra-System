"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyPartNoButtonProps {
  partNo: string;
}

export default function CopyPartNoButton({ partNo }: CopyPartNoButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
      const textArea = document.createElement("textarea");
      textArea.value = partNo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all border ${
        copied
          ? "bg-emerald-50 text-emerald-800 border-emerald-300 scale-[1.02]"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 border-zinc-200"
      }`}
      title="Klik untuk salin nomor suku cadang"
      aria-label="Salin nomor suku cadang"
    >
      <span>NO. PART: {partNo}</span>
      {copied ? (
        <span className="flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700">
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
          <span>Tersalin!</span>
        </span>
      ) : (
        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" />
      )}
    </button>
  );
}
