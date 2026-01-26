// client/worklet.js

// Import genish.js - the UMD wrapper will set genish on the global scope
let genishLoadError = null;
try {
  // importScripts needs an absolute URL or a path relative to the worklet script
  // Since the worklet is loaded from /client/worklet.js, we need to go up one level
  importScripts('../genish.js');
} catch (e) {
  genishLoadError = e.toString();
  console.error('[Worklet] Failed to import genish.js:', e, e.stack);
}

// After importScripts, genish should be available globally

class GenishProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    try {
      this.port.postMessage({ type: 'info', message: 'GenishProcessor constructor called' });

      if (genishLoadError) {
        this.port.postMessage({ type: 'error', message: `genish import error: ${genishLoadError}` });
      }

      // Check if genish is available in the global scope
      this.port.postMessage({ type: 'info', message: 'Checking for genish...' });

      // In AudioWorkletGlobalScope, genish should be available globally
      const genishCheck = (typeof globalThis !== 'undefined' && globalThis.genish) ? globalThis.genish :
                          (typeof genish !== 'undefined' ? genish : undefined);

      this.port.postMessage({ type: 'info', message: `genish type: ${typeof genishCheck}` });

      if (!genishCheck) {
        this.port.postMessage({ type: 'error', message: 'genish is not available in worklet!' });
      } else {
        this.port.postMessage({ type: 'info', message: `genish loaded, has cycle: ${typeof genishCheck.cycle}, has gen: ${typeof genishCheck.gen}` });
      }

      this.port.postMessage({ type: 'info', message: 'Setting up message handler...' });
      this.port.onmessage = this.handleMessage.bind(this);

      this.registry = new Map();
      this.t = 0; // Global time accumulator
      this.sampleRate = 44100;
      this.logProcessOnce = true;

      this.port.postMessage({ type: 'info', message: 'Constructor completed successfully' });
    } catch (e) {
      this.port.postMessage({ type: 'error', message: `Constructor error: ${e.toString()}` });
    }
  }

  handleMessage(event) {
    const { type, label, graph, sampleRate } = event.data;
    console.log(`[GenishProcessor] Message received: type='${type}', label='${label}'`);
    if (type === 'init') {
        this.sampleRate = sampleRate;
        console.log(`[GenishProcessor] Sample rate set to ${sampleRate}`);
        return
    }

    if (type === 'add' || type === 'update') {
      try {
        // Make genish available in eval scope
        // In AudioWorkletGlobalScope, genish should be directly available
        // Use 'gen' as variable name to avoid "Cannot access 'genish' before initialization" error
        const gen = (typeof globalThis !== 'undefined' && globalThis.genish) ? globalThis.genish :
                    (typeof genish !== 'undefined' ? genish : undefined);

        if (!gen) {
          throw new Error('genish is not available');
        }
        if (!gen.gen || !gen.gen.createCallback) {
          this.port.postMessage({ type: 'error', message: `genish.gen.createCallback not available. gen.gen type: ${typeof gen.gen}` });
          throw new Error('genish.gen.createCallback not available');
        }
        this.port.postMessage({ type: 'info', message: 'About to eval and compile graph' });

        // The graph string is a function like: "(t) => genish.mul(genish.cycle(440), 0.5)"
        // We need to make genish available in the eval scope
        const genish = gen; // Alias for use in eval

        // Evaluate the function
        const graphFn = eval(graph);

        // Call the function with a dummy time to get the genish graph object
        const genishGraph = graphFn(0);
        this.port.postMessage({ type: 'info', message: `genishGraph type: ${typeof genishGraph}, name: ${genishGraph?.name}` });

        // Now compile the genish graph into an optimized callback
        const compiledCallback = gen.gen.createCallback(genishGraph, this.sampleRate);
        this.port.postMessage({ type: 'info', message: `Successfully compiled signal '${label}'` });

        const current = this.registry.get(label);

        if (current && type === 'update') {
          // Crossfade
          this.registry.set(label, {
            graph: compiledCallback,
            oldGraph: current.graph,
            fade: 0.0,
            fadeDuration: 0.05 * this.sampleRate // 50ms fade
          });
        } else {
          this.registry.set(label, { graph: compiledCallback, oldGraph: null, fade: 1.0 });
        }
        console.log(`[GenishProcessor] Registry now has ${this.registry.size} entries`);
      } catch (e) {
        console.error(`[GenishProcessor] Error compiling graph for label '${label}':`, e);
        this.port.postMessage({ type: 'error', message: e.toString(), stack: e.stack });
      }
    } else if (type === 'remove') {
      this.registry.delete(label);
    }
  }

  process(inputs, outputs, parameters) {
    if (this.logProcessOnce) {
        this.port.postMessage({ type: 'info', message: `process() called, registry size: ${this.registry.size}` });
        this.logProcessOnce = false;
    }
    const output = outputs[0];
    const channel = output[0];

    for (let i = 0; i < channel.length; i++) {
      let sample = 0;
      this.t += 1 / this.sampleRate; // Increment global time

      for (const [label, synth] of this.registry.entries()) {
        try {
            let currentSample = 0;

            // Call the compiled genish callback (no arguments needed, it generates the next sample)
            currentSample += synth.graph();

            // Handle crossfade if an old graph exists
            if (synth.oldGraph) {
              const oldSample = synth.oldGraph();
              const fadeValue = synth.fade / synth.fadeDuration;

              currentSample = (currentSample * fadeValue) + (oldSample * (1 - fadeValue));

              synth.fade++;
              if (synth.fade >= synth.fadeDuration) {
                synth.oldGraph = null; // End of fade
              }
            }

            sample += currentSample;
        } catch (e) {
            this.port.postMessage({ type: 'error', message: `Runtime error in '${label}': ${e.toString()}` });
            // Optionally, remove the faulty synth to prevent further errors
            this.registry.delete(label);
        }
      }

      // Basic hard clip to prevent speaker damage
      channel[i] = Math.max(-1, Math.min(1, sample));
    }

    return true;
  }
}

registerProcessor('genish-processor', GenishProcessor);
