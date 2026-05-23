"use client";
import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import type { IndexedPdf } from "@/lib/pdf-context";

interface Props {
  document: IndexedPdf | null;
  disabled: boolean;
  onChange: (document: IndexedPdf | null) => void;
}

export default function PdfUpload({ document, disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/pdf", { method: "POST", body: formData });
      const data = await response.json() as IndexedPdf & { error?: string };
      if (!response.ok || data.error) throw new Error(data.error ?? "PDF upload failed.");
      onChange(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PDF upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-emerald-600/25 bg-emerald-950/15 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={15} className="text-emerald-300 shrink-0" />
          {document ? (
            <div className="min-w-0">
              <p className="truncate text-xs text-emerald-100 font-medium">{document.name}</p>
              <p className="text-[10px] text-emerald-400/70">
                {document.indexedPages} of {document.totalPages} pages searchable
                {document.truncated ? " · excerpt limit reached" : ""}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-emerald-300/80">
              Upload a text-based PDF for cited answers with GPT-OSS.
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={disabled || uploading}
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30
              bg-emerald-800/25 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider
              text-emerald-200 hover:bg-emerald-700/35 disabled:opacity-40 cursor-pointer">
            {uploading
              ? <><Loader2 size={11} className="animate-spin" /> Indexing</>
              : <><Upload size={11} /> {document ? "Replace" : "Upload PDF"}</>}
          </button>
          {document && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange(null)}
              title="Remove PDF context"
              className="p-1.5 text-emerald-400/60 hover:text-emerald-200 cursor-pointer disabled:opacity-40">
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}
      <p className="mt-1.5 text-[9px] text-emerald-500/50 uppercase tracking-widest">
        Processed for this tab only · 5 MB maximum
      </p>
    </div>
  );
}
