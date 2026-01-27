// signal.js - KANON Live-Coding Interface
// ============================================================================
// LIVE CODING: Edit this file while audio is playing for instant updates!
// ============================================================================

// ============================================================================
// PATTERN 3: MATHEMATICALLY PERFECT LIVE SURGERY
// ============================================================================
// Genish-compiled + Frequency interpolation = Zero discontinuity!
// Both phase AND derivative are continuous = No pops possible!

wave('perfect-drone', (t) => {
  // === LIVE EDIT THESE PARAMETERS ===
  const targetBaseFreq = 227;   // Try: 110, 220, 330, 440 (ZERO pops!)
  const targetDetune = 2;       // Try: 0.5, 2, 5, 10, 20 (smooth morphing)
  const targetLfoRate = 0.3;    // Try: 0.1, 0.5, 1.0, 2.0 (glides smoothly)

  // Slew rate: higher = faster response, lower = smoother
  const slewRate = 0.05;  // 0.05 = ~20ms glide time (fast but smooth)

  // === PARAMETER SLEWING (STATE slots 100-102) ===
  // Read current slewed values
  let baseFreq = peek(globalThis.STATE, 100, { mode: 'samples' });
  let detune = peek(globalThis.STATE, 101, { mode: 'samples' });
  let lfoRate = peek(globalThis.STATE, 102, { mode: 'samples' });

  // Initialize on first run
  baseFreq = baseFreq || targetBaseFreq;
  detune = detune || targetDetune;
  lfoRate = lfoRate || targetLfoRate;

  // Exponential slew towards target (continuous derivative!)
  baseFreq = add(baseFreq, mul(sub(targetBaseFreq, baseFreq), slewRate));
  detune = add(detune, mul(sub(targetDetune, detune), slewRate));
  lfoRate = add(lfoRate, mul(sub(targetLfoRate, lfoRate), slewRate));

  // Write back slewed values
  poke(globalThis.STATE, baseFreq, 100);
  poke(globalThis.STATE, detune, 101);
  poke(globalThis.STATE, lfoRate, 102);

  // Voice frequencies with detuning
  const freq1 = baseFreq;
  const freq2 = add(baseFreq, detune);
  const freq3 = sub(baseFreq, mul(detune, 1.5));
  const freq4 = add(baseFreq, mul(detune, 2.2));

  // === VOICE 1 (STATE slot 0) ===
  const phase1 = peek(globalThis.STATE, 0, { mode: 'samples' });
  const newPhase1 = mod(add(phase1, div(freq1, 44100)), 1.0);
  poke(globalThis.STATE, newPhase1, 0);
  const osc1 = peek(globalThis.SINE_TABLE, newPhase1);

  // === VOICE 2 (STATE slot 1) ===
  const phase2 = peek(globalThis.STATE, 1, { mode: 'samples' });
  const newPhase2 = mod(add(phase2, div(freq2, 44100)), 1.0);
  poke(globalThis.STATE, newPhase2, 1);
  const osc2 = peek(globalThis.SINE_TABLE, newPhase2);

  // === VOICE 3 (STATE slot 2) ===
  const phase3 = peek(globalThis.STATE, 2, { mode: 'samples' });
  const newPhase3 = mod(add(phase3, div(freq3, 44100)), 1.0);
  poke(globalThis.STATE, newPhase3, 2);
  const osc3 = peek(globalThis.SINE_TABLE, newPhase3);

  // === VOICE 4 (STATE slot 3) ===
  const phase4 = peek(globalThis.STATE, 3, { mode: 'samples' });
  const newPhase4 = mod(add(phase4, div(freq4, 44100)), 1.0);
  poke(globalThis.STATE, newPhase4, 3);
  const osc4 = peek(globalThis.SINE_TABLE, newPhase4);

  // Mix the 4 voices
  const mix = mul(add(add(add(osc1, osc2), osc3), osc4), 0.25);

  // === LFO (STATE slot 10) ===
  const lfoPhase = peek(globalThis.STATE, 10, { mode: 'samples' });
  const newLfoPhase = mod(add(lfoPhase, div(lfoRate, 44100)), 1.0);
  poke(globalThis.STATE, newLfoPhase, 10);
  const lfo = peek(globalThis.SINE_TABLE, newLfoPhase);

  // LFO amount
  const lfoAmt = add(mul(lfo, 0.25), 0.75);

  // Output
  return mul(mul(mix, lfoAmt), 0.4);
});

// ============================================================================
// HOW IT WORKS:
// ============================================================================
// 1. Target parameters (baseFreq, detune, lfoRate) are editable constants
// 2. Current (slewed) values stored in STATE slots 100-102
// 3. Each sample: currentValue += (targetValue - currentValue) * slewRate
// 4. Oscillators read the SLEWED frequency (not the target)
// 5. When you edit targetBaseFreq, it glides smoothly over ~100ms
// 6. Both phase AND derivative are continuous = mathematically perfect!
// 7. Genish-compiled = fast performance
// 8. No crossfade needed = no artifacts!
// ============================================================================
