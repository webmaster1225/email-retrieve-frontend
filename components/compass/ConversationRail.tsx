"use client";

import type { ChatMessage } from "@/lib/compass/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  placeholder?: string;
};

function renderText(text: string) {
  // Simple **bold** support for Section F copy
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ConversationRail({ messages, onSubmit, placeholder }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <aside className="compass-rail">
      <h2 className="compass-pane-title">Conversation</h2>
      <div className="compass-rail-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`compass-msg compass-msg-${m.role}`}
          >
            <div className="compass-msg-label">{m.role === "agent" ? "Compass" : "You"}</div>
            <div className="compass-msg-body">{renderText(m.text)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="compass-rail-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSubmit(text);
          setText("");
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || "Reply…"}
          className="compass-rail-input"
        />
        <button type="submit" className="button small primary">
          Send
        </button>
      </form>
    </aside>
  );
}
