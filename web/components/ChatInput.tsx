"use client";
import { useRef, useEffect, FormEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, loading }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loading && value.trim()) onSubmit();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit}
      className="glass rounded-2xl flex items-end gap-2 p-2 glow-hover
        border-violet-600/20 focus-within:border-violet-500/50
        focus-within:shadow-[0_0_20px_rgba(124,58,237,0.25)]
        transition-all duration-300">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask minios AI anything…"
        disabled={loading}
        className="flex-1 bg-transparent resize-none outline-none text-sm
          text-violet-100 placeholder-violet-400/50 px-2 py-1.5
          max-h-40 leading-relaxed"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
          bg-violet-700 hover:bg-violet-600 disabled:opacity-40
          transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed">
        {loading
          ? <Loader2 size={16} className="text-white animate-spin" />
          : <Send size={16} className="text-white" />
        }
      </button>
    </form>
  );
}
