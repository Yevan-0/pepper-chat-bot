import { useState, useEffect } from "react";

export default function App() {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    // model might already be done by the time App mounts
    if (window.mlReady) {
      setReady(true);
    } else {
      window.addEventListener("model-ready", () => setReady(true));
    }
  }, []);

  const handleAsk = () => {
    if (!window.mlReady) return;
    const res = window.predict(input);
    setResult(res);
  };

  if (!ready) return <p>Training model, please wait...</p>;

  return (
    <>
      <div>Pepper</div>
      <div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button onClick={handleAsk}>Ask</button>

        {result && (
          <div>
            <p>Label: {result.label}</p>
            <p>Confidence: {result.confidence}</p>
          </div>
        )}
      </div>
    </>
  )
}