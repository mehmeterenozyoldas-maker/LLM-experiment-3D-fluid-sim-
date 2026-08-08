import React, { useState, useRef } from 'react';
import FluidCanvas from './components/FluidCanvas';
import ControlPanel from './components/ControlPanel';
import ChatInterface from './components/ChatInterface';
import { AnalyticsLab } from './components/AnalyticsLab';
import { FluidConfig, FluidMetrics, ViewMode, ColorPalette, ForceObjectType, BackgroundMode, BoundingStyle } from './types';
import { Fluid } from './utils/fluidSolver';
import { DEFAULT_LIGHTING, DEFAULT_ENVIRONMENT } from './utils/presets';

const App: React.FC = () => {
  const fluidRef = useRef<Fluid | null>(null);

  const [config, setConfig] = useState<FluidConfig>({
    diffusion: 0.0000002,
    viscosity: 0.0000001,
    dt: 0.12,
    fadeRate: 0.98,
    solverIterations: 5,
    vorticityStrength: 0.4,
    particleCount: 1500,
    viewMode: ViewMode.Density,
    colorPalette: ColorPalette.Nebula,
    autoInjectNoise: true,
    lighting: DEFAULT_LIGHTING,
    environment: DEFAULT_ENVIRONMENT,
    forceObjects: [
      {
        id: 'initial-attractor',
        type: ForceObjectType.BlackHole,
        x: 16,
        y: 16,
        z: 16,
        strength: 2.0,
        radius: 6,
        color: '#00e5ff',
        active: true
      }
    ]
  });

  const [metrics, setMetrics] = useState<FluidMetrics>({
    fps: 60,
    reynoldsNumber: 1200,
    kineticEnergy: 45.2,
    maxVorticity: 0.85,
    activeParticles: 1500
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white font-sans select-none">
      
      {/* 3D Fluid & Particle Swarm Simulation Canvas */}
      <FluidCanvas 
        config={config} 
        onMetricsUpdate={setMetrics} 
        fluidRefOut={fluidRef}
      />
      
      {/* Overlay CFD Control Panel */}
      <ControlPanel 
        config={config} 
        setConfig={setConfig} 
        metrics={metrics} 
      />
      
      {/* Gemini Physics Assistant */}
      <ChatInterface 
        config={config} 
        setConfig={setConfig}
        metrics={metrics}
      />

      {/* PhD Spectral Analytics Lab & Diagnostics Suite */}
      <AnalyticsLab
        fluidRef={fluidRef}
        metrics={metrics}
      />

      {/* Top Center Quick Hints & View Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-3 bg-slate-950/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-mono text-slate-300 shadow-xl">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-cyan-300 font-semibold">{config.viewMode}</span> Mode
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Click & Drag to Rotate • Shift+Click to Inject</span>
      </div>

    </div>
  );
};

export default App;
