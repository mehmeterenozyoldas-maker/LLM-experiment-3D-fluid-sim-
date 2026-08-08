import React, { useState } from 'react';
import { 
  FluidConfig, 
  FluidMetrics, 
  ViewMode, 
  ColorPalette, 
  ForceObjectType, 
  ForceObject,
  BackgroundMode,
  BoundingStyle
} from '../types';
import { PRESET_SCENARIOS } from '../utils/presets';
import { 
  Sliders, 
  Eye, 
  Sparkles, 
  Zap, 
  Activity, 
  Plus, 
  Trash2, 
  Flame, 
  Compass, 
  Wind, 
  Maximize2,
  Sun,
  Globe,
  RotateCw
} from 'lucide-react';

interface ControlPanelProps {
  config: FluidConfig;
  setConfig: React.Dispatch<React.SetStateAction<FluidConfig>>;
  metrics: FluidMetrics;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, metrics }) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'visuals' | 'lighting' | 'presets' | 'attractors'>('physics');

  const handleChange = <K extends keyof FluidConfig>(key: K, value: FluidConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLightingChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      lighting: {
        ...prev.lighting,
        [key]: value
      }
    }));
  };

  const handleEnvChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        [key]: value
      }
    }));
  };

  const addForceObject = (type: ForceObjectType) => {
    const newForce: ForceObject = {
      id: `force-${Date.now()}`,
      type,
      x: 16,
      y: 16,
      z: 16,
      strength: 2.0,
      radius: 6,
      color: type === ForceObjectType.BlackHole ? '#00e5ff' : '#e040fb',
      active: true
    };
    setConfig(prev => ({
      ...prev,
      forceObjects: [...prev.forceObjects, newForce]
    }));
  };

  const removeForceObject = (id: string) => {
    setConfig(prev => ({
      ...prev,
      forceObjects: prev.forceObjects.filter(f => f.id !== id)
    }));
  };

  const toggleForceObject = (id: string) => {
    setConfig(prev => ({
      ...prev,
      forceObjects: prev.forceObjects.map(f => f.id === id ? { ...f, active: !f.active } : f)
    }));
  };

  const updateForceStrength = (id: string, strength: number) => {
    setConfig(prev => ({
      ...prev,
      forceObjects: prev.forceObjects.map(f => f.id === id ? { ...f, strength } : f)
    }));
  };

  // Determine Reynolds regime
  const getReRegime = (re: number) => {
    if (re < 100) return { label: 'Laminar Flow', color: 'text-cyan-400' };
    if (re < 1500) return { label: 'Transitional Eddies', color: 'text-yellow-400' };
    return { label: 'Turbulent Chaos', color: 'text-red-400' };
  };

  const reRegime = getReRegime(metrics.reynoldsNumber);

  return (
    <div className="absolute top-4 left-4 z-10 w-84 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 text-white shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden">
      {/* Title Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-base font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            NebulaFlow 3D
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">CFD & Astrophysical Dynamics Lab</p>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400">{metrics.fps} FPS</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 rounded-lg mb-3 border border-white/5">
        <button
          onClick={() => setActiveTab('physics')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all ${
            activeTab === 'physics' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 mb-0.5" />
          Physics
        </button>
        <button
          onClick={() => setActiveTab('visuals')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all ${
            activeTab === 'visuals' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5 mb-0.5" />
          Visuals
        </button>
        <button
          onClick={() => setActiveTab('lighting')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all ${
            activeTab === 'lighting' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5 mb-0.5" />
          Lighting
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all ${
            activeTab === 'presets' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 mb-0.5" />
          Presets
        </button>
        <button
          onClick={() => setActiveTab('attractors')}
          className={`flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all ${
            activeTab === 'attractors' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 mb-0.5" />
          Forces
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
        {/* PHYSICS TAB */}
        {activeTab === 'physics' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> Viscosity (ν)
                </span>
                <span className="font-mono text-[11px] text-cyan-400">{config.viscosity.toFixed(7)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.0001"
                step="0.0000001"
                value={config.viscosity}
                onChange={(e) => handleChange('viscosity', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-purple-400" /> Diffusion (D)
                </span>
                <span className="font-mono text-[11px] text-purple-400">{config.diffusion.toFixed(7)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.0001"
                step="0.0000001"
                value={config.diffusion}
                onChange={(e) => handleChange('diffusion', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3 text-pink-400" /> Vorticity Confinement (ε)
                </span>
                <span className="font-mono text-[11px] text-pink-400">{config.vorticityStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={config.vorticityStrength}
                onChange={(e) => handleChange('vorticityStrength', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" /> Time Step (Δt)
                </span>
                <span className="font-mono text-[11px] text-amber-400">{config.dt.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.3"
                step="0.01"
                value={config.dt}
                onChange={(e) => handleChange('dt', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* VISUALS TAB */}
        {activeTab === 'visuals' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                3D Field Rendering Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { mode: ViewMode.Density, label: 'Density Cloud' },
                  { mode: ViewMode.Velocity, label: 'Velocity Vectors' },
                  { mode: ViewMode.Vorticity, label: 'Vorticity Heatmap' },
                  { mode: ViewMode.Pressure, label: 'Pressure Gradient' },
                  { mode: ViewMode.Stardust, label: 'Stardust Tracer' },
                  { mode: ViewMode.Hybrid, label: 'Hybrid Volumetric' }
                ].map(item => (
                  <button
                    key={item.mode}
                    onClick={() => handleChange('viewMode', item.mode)}
                    className={`py-1.5 px-2 rounded-md text-[10px] text-left transition-all ${
                      config.viewMode === item.mode
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                Astrophysical Color Palette
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { palette: ColorPalette.Nebula, label: 'Cyan / Magenta Nebula' },
                  { palette: ColorPalette.Supernova, label: 'Supernova Blast' },
                  { palette: ColorPalette.Aurora, label: 'Coronal Aurora' },
                  { palette: ColorPalette.AccretionDisk, label: 'Keplerian Accretion' },
                  { palette: ColorPalette.QuantumPlasma, label: 'Quantum Plasma' }
                ].map(item => (
                  <button
                    key={item.palette}
                    onClick={() => handleChange('colorPalette', item.palette)}
                    className={`py-1.5 px-2 rounded-md text-[10px] text-left transition-all ${
                      config.colorPalette === item.palette
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Tracer Particle Swarm</span>
                <span className="font-mono text-cyan-400">{config.particleCount}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={config.particleCount}
                onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-300">Ambient Noise Jet Injector</span>
              <button
                onClick={() => handleChange('autoInjectNoise', !config.autoInjectNoise)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  config.autoInjectNoise ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                  config.autoInjectNoise ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* LIGHTING & ENVIRONMENT TAB */}
        {activeTab === 'lighting' && (
          <div className="space-y-3.5">
            {/* Background Mode */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-400" /> Background Atmosphere
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { mode: BackgroundMode.DeepSpace, label: 'Deep Space Void' },
                  { mode: BackgroundMode.CosmicGrid, label: 'Spatial Grid Plane' },
                  { mode: BackgroundMode.EventHorizon, label: 'Event Horizon' },
                  { mode: BackgroundMode.SolarCorona, label: 'Solar Coronal Flare' },
                  { mode: BackgroundMode.QuantumMatrix, label: 'Quantum Matrix' }
                ].map(item => (
                  <button
                    key={item.mode}
                    onClick={() => handleEnvChange('backgroundMode', item.mode)}
                    className={`py-1.5 px-2 rounded-md text-[10px] text-left transition-all ${
                      config.environment.backgroundMode === item.mode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bounding Style */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                3D Grid Bounding Frame
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { style: BoundingStyle.WireframeCube, label: 'Wireframe Cube' },
                  { style: BoundingStyle.SpatialGrid, label: '3D Spatial Grid' },
                  { style: BoundingStyle.CoordinateAxes, label: 'RGB Vector Axes' },
                  { style: BoundingStyle.CyberGlass, label: 'Cyber Glass Frame' }
                ].map(item => (
                  <button
                    key={item.style}
                    onClick={() => handleEnvChange('boundingStyle', item.style)}
                    className={`py-1.5 px-2 rounded-md text-[10px] text-left transition-all ${
                      config.environment.boundingStyle === item.style
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Controls */}
            <div className="space-y-2.5 pt-1 border-t border-white/10">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" /> Ambient Light
                  </span>
                  <span className="font-mono text-[11px] text-amber-400">
                    {Math.round(config.lighting.ambientLight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.lighting.ambientLight}
                  onChange={(e) => handleLightingChange('ambientLight', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Directional Sun Beam</span>
                  <span className="font-mono text-amber-400">
                    {Math.round(config.lighting.directionalLightIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.lighting.directionalLightIntensity}
                  onChange={(e) => handleLightingChange('directionalLightIntensity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Light Spectrum Hue</span>
                  <span className="font-mono text-cyan-400">{config.lighting.lightHue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={config.lighting.lightHue}
                  onChange={(e) => handleLightingChange('lightHue', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Background Star Density</span>
                  <span className="font-mono text-purple-400">{config.environment.starCount}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={config.environment.starCount}
                  onChange={(e) => handleEnvChange('starCount', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-cyan-400" /> Cinematic Camera Orbit
                </span>
                <button
                  onClick={() => handleEnvChange('autoRotateCamera', !config.environment.autoRotateCamera)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    config.environment.autoRotateCamera ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    config.environment.autoRotateCamera ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 mb-2">
              Select an astrophysical benchmark scenario to auto-configure physics, view modes, and initial forces:
            </p>
            {PRESET_SCENARIOS.map(preset => (
              <div
                key={preset.id}
                onClick={() => setConfig(prev => ({ ...prev, ...preset.config }))}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-cyan-300 text-xs group-hover:text-cyan-200">
                    {preset.name}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                <div className="mt-1.5 p-1 bg-black/40 rounded font-mono text-[9px] text-slate-300 border border-white/5">
                  {preset.formula}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ATTRACTORS / EMITTERS TAB */}
        {activeTab === 'attractors' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
                Spawn 3D Force Emitters
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => addForceObject(ForceObjectType.BlackHole)}
                  className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Black Hole
                </button>
                <button
                  onClick={() => addForceObject(ForceObjectType.Pulsar)}
                  className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Pulsar Repeller
                </button>
                <button
                  onClick={() => addForceObject(ForceObjectType.CosmicTornado)}
                  className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Cosmic Vortex
                </button>
                <button
                  onClick={() => addForceObject(ForceObjectType.SupernovaEmitter)}
                  className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 hover:bg-red-950 text-red-300 border border-red-500/30 text-[10px]"
                >
                  <Plus className="w-3 h-3" /> Supernova Core
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Active 3D Forces ({config.forceObjects.length})
              </label>
              {config.forceObjects.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No force objects active. Spawn one above!</p>
              ) : (
                config.forceObjects.map(f => (
                  <div key={f.id} className="p-2 bg-slate-900/90 rounded-lg border border-white/10 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-cyan-300 text-[11px]">{f.type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleForceObject(f.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                            f.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {f.active ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => removeForceObject(f.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Strength</span>
                        <span className="font-mono text-cyan-400">{f.strength.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={f.strength}
                        onChange={(e) => updateForceStrength(f.id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live CFD Telemetry Box */}
      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl text-[10px] font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Reynolds No. (Re):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold">{metrics.reynoldsNumber.toFixed(0)}</span>
            <span className={`text-[9px] font-sans px-1 rounded bg-black/40 ${reRegime.color}`}>
              {reRegime.label}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Kinetic Energy (E_k):</span>
          <span className="text-purple-300 font-bold">{metrics.kineticEnergy.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Peak Vorticity (|ω|_max):</span>
          <span className="text-pink-300 font-bold">{metrics.maxVorticity.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
