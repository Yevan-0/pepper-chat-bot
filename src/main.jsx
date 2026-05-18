import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { trainModel, predict } from './model';
import dataset from "./dataset.json";

async function test() {
  console.log("Training...");
  await trainModel(dataset, (ep, logs) => {
    if (ep % 20 === 0)
      console.log(`Epoch ${ep} | Loss: ${logs.loss.toFixed(3)} | Acc: ${logs.acc?.toFixed(3)}`);
  });

  console.log("Testing predictions...");
  const tests = [
    "What fruit do you like?",
    "What is your favorite meal?",
    "Which color is the sky?",
    "What animal is the most loyal?",
    "what animal is the best?",
    "do you prefer eating dogs or bananas?"
  ];

  for (const q of tests) {
    const result = predict(q);
    console.log(`Q: "${q}" → ${result.label} (${result.confidence})`);
  }
}

test();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
