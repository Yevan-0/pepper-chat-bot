import "./App.css";
import { useState, useEffect, useRef } from "react";

const TypingIndicator = () => {
  return (
    <div className="msg-row">
      <div className="avatar ai">AI</div>
      <div className="bubble ai">
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

const Message = ({ role, text }) => {
  return (
    <div className={`msg-row ${role}`}>
      <div className={`avatar ${role}`}>{role === "ai" ? "AI" : "U"}</div>
      <div className={`bubble ${role}`}>{text}</div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (window.mlReady) {
      setReady(true);
    } else {
      window.addEventListener("model-ready", () => setReady(true));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!window.mlReady) {
      setError("Model is still loading, please wait…");
      return;
    }

    setError(null);
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Slight delay to show typing indicator before result
    setTimeout(() => {
      try {
        const res = window.predict(text);
        const reply = `${res.label}`;
        setMessages(prev => [...prev, { role: "ai", text: reply }]);
      } catch (e) {
        setError("Something went wrong running the model.");
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shell">
      {/* Header */}
      <div className="header">
        <div className="header-dot" />
        <span className="header-title">Pepper</span>
        <span className="header-sub">{ready ? "model ready" : "loading…"}</span>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <span>Send a message to get a prediction</span>
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-wrap">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask something…"
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading || !ready}
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1 7.5h13M8 2l6 5.5-6 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        <div className="hint">shift+enter for newline · enter to send</div>
      </div>
    </div>
  );
}