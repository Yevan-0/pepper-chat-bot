import "./App.css"
import { useState, useRef, useEffect } from "react";
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "22px";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setError(null);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "22px";
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: updated,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text ?? "";

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return (
    <div>
      <div className="shell">
        <header className="header">
          <div className="header-dot" />
          <span className="header-title">Assistant</span>
          <span className="header-sub">claude-sonnet-4</span>
        </header>

        <div className="messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <span>Start a conversation</span>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role === "user" ? "user" : "ai"}`}>
              <div className={`avatar ${m.role === "user" ? "user" : "ai"}`}>
                {m.role === "user" ? "U" : "AI"}
              </div>
              <div className={`bubble ${m.role === "user" ? "user" : "ai"}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row ai">
              <div className="avatar ai">AI</div>
              <div className="bubble ai">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div className="input-wrap">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message…"
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <p className="hint">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}