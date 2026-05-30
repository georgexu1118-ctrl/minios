"use client";
import { useRef, useEffect, useState, FormEvent } from "react";
import { Send, Loader2, ImagePlus, X, FileText } from "lucide-react";

export interface PdfAttachment {
  name: string;
  text: string;
  chars: number;
  truncated?: boolean;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Array of base-64 data-URLs for all attached screenshots. */
  images?: string[];
  onImagesChange?: (imgs: string[]) => void;
  pdf?: PdfAttachment | null;
  onPdfChange?: (pdf: PdfAttachment | null) => void;
}

export default function ChatInput({
  value, onChange, onSubmit, loading,
  images = [], onImagesChange,
  pdf, onPdfChange,
}: Props) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loading && (value.trim() || images.length)) onSubmit();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && (value.trim() || images.length)) onSubmit();
    }
  }

  // Downscale to a max 1024px long edge and re-encode as JPEG (q=0.82).
  // A 4K screenshot drops from ~6 MB to ~120 KB — vision encoder runs ~3× faster.
  async function downscale(file: File, maxEdge = 1024): Promise<string> {
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("image decode failed"));
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 400_000) return dataUrl; // already small
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  /** Append one downscaled image to the array, cap at 5 images. */
  async function addImageFile(file: File) {
    if (!onImagesChange) return;
    if (images.length >= 5) return; // reasonable cap
    try {
      const shrunk = await downscale(file);
      onImagesChange([...images, shrunk]);
    } catch {
      const r = new FileReader();
      r.onload = () => onImagesChange([...images, r.result as string]);
      r.readAsDataURL(file);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) await addImageFile(f);
    e.target.value = "";
  }

  // Extract PDF text entirely in the browser using unpdf (no server upload).
  // This bypasses Vercel's 4.5 MB request body limit — only the extracted text
  // (typically 30–80 KB for a 50-page doc) is ever sent to the server.
  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onPdfChange) return;
    setPdfLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      // Dynamic import keeps the PDF.js bundle out of the initial JS load.
      const { extractText } = await import("unpdf");
      const { text } = await extractText(new Uint8Array(buffer));
      const pages = Array.isArray(text) ? text : [text];
      const joined = pages
        .map((pageText, i) => {
          const cleaned = (pageText ?? "").replace(/\s+/g, " ").trim();
          return cleaned ? `[Page ${i + 1}]\n${cleaned}` : "";
        })
        .filter(Boolean)
        .join("\n\n");

      if (!joined) throw new Error("No selectable text found. Scanned / image-only PDFs are not supported.");

      const MAX_CHARS = 150_000;
      const truncated = joined.length > MAX_CHARS;
      onPdfChange({
        name: file.name,
        text: truncated ? joined.slice(0, MAX_CHARS) : joined,
        chars: joined.length,
        truncated,
      });
    } catch (err) {
      alert(`PDF read failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPdfLoading(false);
      e.target.value = "";
    }
  }

  // Paste a screenshot directly from the clipboard (Win+Shift+S → Ctrl+V).
  // All image items in the clipboard are appended (e.g. multiple Win+Shift+S
  // captures copied one after another will each add a new thumbnail).
  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (!onImagesChange) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    let intercepted = false;
    for (const item of Array.from(items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;
        if (!intercepted) {
          e.preventDefault(); // prevent binary text insertion only once
          intercepted = true;
        }
        await addImageFile(file);
      }
    }
    // No image in clipboard → let the textarea handle normal text paste
  }

  const canSend = !loading && (value.trim().length > 0 || images.length > 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment previews */}
      {(images.length > 0 || pdf) && (
        <div className="flex items-start gap-2 flex-wrap">
          {images.map((src, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-violet-500/40 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
              {onImagesChange && (
                <button
                  type="button"
                  onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center
                    hover:bg-black/90 transition-colors cursor-pointer"
                  aria-label={`Remove screenshot ${idx + 1}`}>
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>
          ))}
          {pdf && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/40
              border border-emerald-500/40 text-emerald-200 text-[11px] font-mono">
              <FileText size={12} />
              <span className="truncate max-w-[200px]" title={pdf.name}>{pdf.name}</span>
              <span className="text-emerald-300/60 text-[10px]">
                {(pdf.chars / 1000).toFixed(1)}k{pdf.truncated ? " · trimmed" : ""}
              </span>
              {onPdfChange && (
                <button
                  type="button"
                  onClick={() => onPdfChange(null)}
                  className="ml-1 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center cursor-pointer"
                  aria-label="Remove PDF">
                  <X size={10} className="text-emerald-200" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}
        className="glass rounded-2xl flex items-end gap-2 p-2 glow-hover
          border-violet-600/20 focus-within:border-violet-500/50
          focus-within:shadow-[0_0_20px_rgba(124,58,237,0.25)]
          transition-all duration-300">

        {/* Hidden file inputs */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handlePdfChange}
        />

        {/* Image upload */}
        {onImagesChange && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading || images.length >= 5}
            title={images.length >= 5 ? "Max 5 screenshots" : "Attach screenshot(s)"}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
              text-violet-400/60 hover:text-violet-300 hover:bg-violet-800/40
              disabled:opacity-40 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed relative">
            <ImagePlus size={16} />
            {images.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white
                text-[9px] font-bold flex items-center justify-center leading-none">
                {images.length}
              </span>
            )}
          </button>
        )}

        {/* PDF upload */}
        {onPdfChange && (
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            disabled={loading || pdfLoading}
            title="Attach PDF"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
              text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-800/40
              disabled:opacity-40 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed">
            {pdfLoading
              ? <Loader2 size={16} className="animate-spin" />
              : <FileText size={16} />}
          </button>
        )}

        <textarea
          ref={textRef}
          rows={1}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          placeholder={images.length ? `Ask about ${images.length > 1 ? "these images" : "this image"}… (paste more with Ctrl/⌘+V)` : "Ask anything… (paste screenshots with Ctrl/⌘+V)"}
          disabled={loading}
          className="flex-1 bg-transparent resize-none outline-none text-sm
            text-violet-100 placeholder-violet-400/50 px-2 py-1.5
            max-h-40 leading-relaxed"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            bg-violet-700 hover:bg-violet-600 disabled:opacity-40
            transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed">
          {loading
            ? <Loader2 size={16} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />
          }
        </button>
      </form>
    </div>
  );
}
