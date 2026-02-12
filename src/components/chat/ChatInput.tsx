"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  readonly isConnected: boolean;
  readonly onSend: (text: string) => void;
}

export function ChatInput({ isConnected, onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, isComposing]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  return (
    <div className="flex items-end gap-2 pt-2 border-t border-[var(--border)]">
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="何でも聞いてください..."
          rows={1}
          className={cn(
            "w-full resize-none bg-[var(--secondary)] text-[14px] font-primary text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] rounded-[var(--radius-m)] px-3.5 py-3 min-h-[44px] max-h-[120px] outline-none border border-transparent transition-colors",
            "focus:border-[var(--ring)] focus:bg-[var(--background)]"
          )}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className={cn(
          "flex items-center justify-center w-[44px] h-[44px] rounded-[var(--radius-m)] transition-colors flex-shrink-0",
          text.trim()
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            : "bg-[var(--secondary)] text-[var(--muted-foreground)] cursor-not-allowed"
        )}
        aria-label="メッセージを送信"
      >
        <span className="material-symbols-sharp text-[20px]">send</span>
      </button>
    </div>
  );
}
