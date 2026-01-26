// signal.js
// Define your audio signals here using helper functions from wave-dsp.js

// Example 1: Simple sine tone
wave('tone', pipe(sin(440), gain(0.3)));

// Example 2: Bass note
// wave('bass', bass(110));

// Example 3: Saw wave
// wave('saw', pipe(saw(220), gain(0.2)));

// Example 4: White noise
// wave('noise', pipe(noise(), gain(0.1)));

// Example 5: Multiple signals playing together
// wave('low', pipe(sin(110), gain(0.3)));
// wave('mid', pipe(sin(220), gain(0.2)));
// wave('high', pipe(sin(440), gain(0.2)));
