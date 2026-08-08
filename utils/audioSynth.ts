// Real-Time Hydrodynamic Web Audio Sonifier
// Synthesizes plasma resonance hums and turbulent shear noise based on live fluid metrics

class HydroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  
  // Oscillators and Nodes
  private subOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private subGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0;
      this.masterGain.connect(this.ctx.destination);

      // Sub-Bass Plasma Oscillator (Sine Wave for fluid resonance)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 55; // A1 bass note

      this.subGain = this.ctx.createGain();
      this.subGain.gain.value = 0.15;
      this.subOsc.connect(this.subGain);
      this.subGain.connect(this.masterGain);
      this.subOsc.start();

      // Pink/White Noise Generator for Turbulent Dissipation
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      // Bandpass Filter controlled by Vorticity
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 400;
      this.filterNode.Q.value = 3.0;

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = 0.05;

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0.0 : 0.2, now, 0.1);
    }
  }

  public toggleMute(): boolean {
    if (!this.isInitialized) {
      this.init();
    }
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public updateTelemetry(kineticEnergy: number, enstrophy: number, maxVorticity: number) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Map Kinetic Energy to Sub Oscillator Frequency (40 Hz to 120 Hz)
    if (this.subOsc) {
      const targetFreq = Math.min(180, 40 + Math.sqrt(Math.max(0, kineticEnergy)) * 8);
      this.subOsc.frequency.setTargetAtTime(targetFreq, now, 0.15);
    }

    // 2. Map Vorticity to Bandpass Filter Frequency (200 Hz to 2400 Hz)
    if (this.filterNode) {
      const targetCutoff = Math.min(2800, 200 + maxVorticity * 800 + enstrophy * 10);
      this.filterNode.frequency.setTargetAtTime(targetCutoff, now, 0.1);
    }

    // 3. Map Enstrophy to Noise Gain Intensity
    if (this.noiseGain) {
      const targetGain = Math.min(0.25, 0.02 + Math.log1p(enstrophy) * 0.04);
      this.noiseGain.gain.setTargetAtTime(targetGain, now, 0.1);
    }
  }
}

export const hydroAudio = new HydroAudioEngine();
