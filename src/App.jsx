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
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef(""); // text already in the box before current recognition session

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

  // Set up speech recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        baseTextRef.current = (baseTextRef.current + " " + finalTranscript).trim();
      }

      const combined = (baseTextRef.current + " " + interimTranscript).trim();
      setInput(combined);
      requestAnimationFrame(autoResize);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was denied.");
      } else if (event.error !== "no-speech") {
        setError("Speech recognition error: " + event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch {}
    };
  }, []);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const toggleListening = () => {
    if (!speechSupported) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setError(null);
    baseTextRef.current = input; // keep whatever's already typed
    try {
      recognition.start();
      setListening(true);
    } catch (e) {
      // start() throws if already started; ignore
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!window.mlReady) {
      setError("Model is still loading, please wait…");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    setError(null);
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    baseTextRef.current = "";
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
            placeholder={listening ? "Listening…" : "Ask something…"}
            value={input}
            onChange={e => { setInput(e.target.value); baseTextRef.current = e.target.value; autoResize(); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            className={`mic-btn${listening ? " listening" : ""}`}
            onClick={toggleListening}
            disabled={loading || !speechSupported}
            aria-label={listening ? "Stop listening" : "Start voice input"}
            title={speechSupported ? (listening ? "Stop listening" : "Start voice input") : "Speech recognition not supported"}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2.5 7.5a5 5 0 0 0 10 0M7.5 12.5V14M5 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

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
        <div className="hint">
          {speechSupported ? "shift+enter for newline · enter to send · mic for voice input" : "shift+enter for newline · enter to send"}
        </div>
      </div>
    </div>
  );
}