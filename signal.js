// signal.js

// Simple test with genish.js
// wave() expects a label and a genish graph expression as a string

// Change frequency to 880Hz (one octave up)
wave('tone', 'genish.mul(genish.cycle(680), 0.3)');
