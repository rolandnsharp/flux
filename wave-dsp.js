// wave-dsp.js
// A functional DSP library wrapping genish.js
// These helpers return genish expression strings for use with wave()

// Basic oscillators
const sin = (freq) => `genish.cycle(${freq})`;
const saw = (freq) => `genish.phasor(${freq})`;
const square = (freq) => `genish.lte(genish.phasor(${freq}), 0.5)`;
const noise = () => `genish.noise()`;

// Effects
const gain = (amount) => (input) => `genish.mul(${input}, ${amount})`;
const add = (a) => (input) => `genish.add(${input}, ${a})`;
const mul = (a) => (input) => `genish.mul(${input}, ${a})`;

// Utilities
const pipe = (...fns) => (initialValue) => {
  return fns.reduce((acc, fn) => fn(acc), initialValue);
};

// Composable examples
const bass = (freq) => pipe(sin(freq), gain(0.5));
const kick = () => pipe(sin(60), mul(0.8));

// Make functions available globally in the browser context
window.sin = sin;
window.saw = saw;
window.square = square;
window.noise = noise;
window.gain = gain;
window.add = add;
window.mul = mul;
window.pipe = pipe;
window.bass = bass;
window.kick = kick;
