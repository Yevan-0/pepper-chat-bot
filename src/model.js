import * as tf from "@tensorflow/tfjs"

// no: of tokens
const MAXLEN = 20;
let vocab = { "<PAD>": 0, "<OOV>": 1 };
let model = null;
let labelNames = [];

// vocabulary building
export const buildVocab = (texts) => {
  // clause for checking empty datasets
  if (!texts || texts.length === 0) {
    console.error("No texts found in dataset!");
    return;
  }
  // the first unseen word is marked as 2 (0 is PAD,  1 is OOV)
  let index = 2;
  // loop through dataset to find text (question)
  for (const text of texts) {
    // loop through dataset to find word (from vocab)
    for (const word of text.toLowerCase().split(/\s+/)) {
      // clause to mark index for unseen word
      if (!vocab[word]) {
        vocab[word] = index++
      }
    }
  }
  console.log('vocab built:', vocab)
}

export const textToSequence = (text) => {
  return text.toLowerCase().split(/\s+/)
    .map(word => vocab[word] ?? vocab["<OOV>"])
}

export const pad = (seq) => {
  if (seq.length >= MAXLEN) return seq.slice(0, MAXLEN);
  return [...seq, ...Array(MAXLEN - seq.length).fill(0)];
}

export const buildModel = (vocabSize, numClass) => {
  model = tf.sequential();
  model.add(tf.layers.embedding({
    inputDim: vocabSize,
    outputDim: 32,
    inputLength: MAXLEN
  }));

  model.add(tf.layers.globalAveragePooling1d());
  model.add(tf.layers.dense({
    units: 16,
    activation: "relu"
  }))
  model.add(tf.layers.dropout({ rate: 0.3 }))
  model.add(tf.layers.dense({ units: numClass, activation: 'softmax' }))
  model.compile({
    optimizer: "adam",
    loss: "sparseCategoricalCrossentropy",
    metrics: ['accuracy']
  })
  return model
}

export const trainModel = async (dataset, onEpochEnd) => {
  const { qa_dataset, labels, label_map } = dataset;
  labelNames = labels;

  // extract data set
  const texts = dataset.qa_dataset.map(item => item.question);
  // convert text to labels
  const numericLabels = dataset.qa_dataset.map(item => label_map[item.answer])

  buildVocab(texts)

  const sequences = texts.map(t => pad(textToSequence(t)));
  const xs = tf.tensor2d(sequences, [sequences.length, MAXLEN], 'int32');
  const ys = tf.tensor1d(numericLabels, 'int32')

  buildModel(Object.keys(vocab).length, labels.length);

  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 4,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epochs, logs) => onEpochEnd?.(epochs, logs)
    }
  })

  xs.dispose();
  ys.dispose();
}

export const predict = (text) => {
  if (!model) throw new Error("Model not found")
  const seq = pad(textToSequence(text));
  const tensor = tf.tensor2d([seq], [1, MAXLEN], 'int32')
  const prob = model.predict(tensor).dataSync();
  tensor.dispose();
  const bestIndex = prob.indexOf(Math.max(...prob))

  return {
    label: labelNames[bestIndex],
    confidence: (prob[bestIndex] * 100).toFixed(1) + "%",
    all: labelNames.map((name, i) => ({
      name,
      prob: (prob[i] * 100).toFixed(1) + "%"
    }))
  }
}
