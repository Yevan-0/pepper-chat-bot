import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { trainModel, predict } from './model';

async function test() {
  const res = await fetch('/dataset.json');
  const dataset = await res.json();

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
    "What animal is the most loyal?"
  ];

  for (const q of tests) {
    const result = predict(q);
    console.log(`Q: "${q}" → ${result.label} (${result.confidence})`);
  }
}

test();

createRoot(document.getElementById('root')).render(
    <App />
)
