import React, { useState, useEffect, useRef } from 'react';
import { FluidMetrics, TelemetrySnapshot } from '../types';
import { Fluid } from '../utils/fluidSolver';
import { hydroAudio } from '../utils/audioSynth';
import { 
  BarChart3, 
  Layers, 
  Volume2, 
  VolumeX, 
  Download, 
  Activity, 
  Sliders, 
  X, 
  ChevronUp, 
  ChevronDown,
  Table,
  Radio,
  Sparkles
} from 'lucide-react';

interface AnalyticsLabProps {
  fluidRef: React.MutableRefObject<Fluid | null>;
  metrics: FluidMetrics;
}

export const AnalyticsLab: React.FC<AnalyticsLabProps> = ({ fluidRef, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'spectrum' | 'slice' | 'audio' | 'telemetry'>('spectrum');

  // Audio state
  const [isMuted, setIsMuted] = useState(true);

  // Slice state
  const [sliceAxis, setSliceAxis] = useState<'XY' | 'XZ' | 'YZ'>('XY');
  const [sliceIndex, setSliceIndex] = useState(16);
  const [sliceField, setSliceField] = useState<'density' | 'vorticity' | 'pressure' | 'velocity'>('density');
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; val: number } | null>(null);

  // Canvas ref for 2D slice preview
  const sliceCanvasRef = useRef<HTMLCanvasElement>(null);

  // Telemetry log state
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [isLogging, setIsLogging] = useState(true);
  const stepCountRef = useRef(0);

  // Audio toggle
  const toggleAudio = () => {
    const newMuted = hydroAudio.toggleMute();
    setIsMuted(newMuted);
  };

  // Record Telemetry periodic snapshot
  useEffect(() => {
    if (!isLogging) return;
    const interval = setInterval(() => {
      stepCountRef.current += 1;
      const snap: TelemetrySnapshot = {
        timestamp: new Date().toLocaleTimeString(),
        step: stepCountRef.current,
        fps: metrics.fps,
        reynoldsNumber: metrics.reynoldsNumber,
        kineticEnergy: metrics.kineticEnergy,
        enstrophy: metrics.enstrophy || 0,
        maxVorticity: metrics.maxVorticity
      };
      setSnapshots(prev => [...prev.slice(-49), snap]); // Keep last 50 entries
    }, 1000);

    return () => clearInterval(interval);
  }, [isLogging, metrics]);

  // Render 2D Slice Canvas
  useEffect(() => {
    if (activeTab !== 'slice' || !sliceCanvasRef.current || !fluidRef.current) return;

    const fluid = fluidRef.current;
    const slice = fluid.getSliceData(sliceAxis, sliceIndex, sliceField);
    const canvas = sliceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const N = slice.width;
    const cellSize = canvas.width / N;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const rawVal = slice.matrix[r][c];
        const norm = Math.min(1, Math.max(0, (rawVal - slice.minVal) / (slice.maxVal - slice.minVal || 1)));

        let fillStyle = '#000000';
        if (sliceField === 'density') {
          fillStyle = `hsl(${180 + norm * 140}, 90%, ${Math.min(100, norm * 80)}%)`;
        } else if (sliceField === 'vorticity') {
          fillStyle = `hsl(${280 - norm * 200}, 100%, ${Math.min(100, norm * 90)}%)`;
        } else if (sliceField === 'pressure') {
          fillStyle = rawVal >= 0 
            ? `hsl(10, 90%, ${Math.min(100, norm * 80)}%)`
            : `hsl(210, 90%, ${Math.min(100, norm * 80)}%)`;
        } else if (sliceField === 'velocity') {
          fillStyle = `hsl(${40 + norm * 280}, 95%, ${Math.min(100, norm * 85)}%)`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }, [activeTab, sliceAxis, sliceIndex, sliceField, fluidRef, metrics]);

  // Handle Slice Hover
  const handleSliceMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sliceCanvasRef.current || !fluidRef.current) return;
    const rect = sliceCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const N = 32;
    const col = Math.floor((x / rect.width) * N);
    const row = Math.floor((y / rect.height) * N);

    const slice = fluidRef.current.getSliceData(sliceAxis, sliceIndex, sliceField);
    if (slice.matrix[row] && slice.matrix[row][col] !== undefined) {
      setHoveredCell({ x: col, y: row, val: slice.matrix[row][col] });
    }
  };

  // CSV Export Handler
  const exportCSV = () => {
    if (snapshots.length === 0) return;
    const headers = 'Timestamp,Step,FPS,ReynoldsNumber,KineticEnergy,Enstrophy,MaxVorticity\n';
    const rows = snapshots.map(s => 
      `${s.timestamp},${s.step},${s.fps},${s.reynoldsNumber.toFixed(2)},${s.kineticEnergy.toFixed(4)},${s.enstrophy.toFixed(4)},${s.maxVorticity.toFixed(4)}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebulaflow_cfd_dataset_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get Fourier Energy Spectrum Data
  const spectrumData = fluidRef.current ? fluidRef.current.getEnergySpectrum() : [];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 left-6 z-20 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400 rounded-full shadow-2xl flex items-center gap-2.5 text-white transition-all hover:scale-105 group"
      >
        <div className="p-1 rounded-full bg-purple-500/20 text-purple-300">
          <BarChart3 className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold tracking-wide">PhD Spectral Analytics & Diagnostics</span>
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
      </button>
    );
  }

  return (
    <div className={`absolute bottom-6 left-6 z-20 w-[440px] bg-slate-950/90 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
      isMinimized ? 'h-14' : 'h-[500px]'
    }`}>
      {/* Header Bar */}
      <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
              Spectral Hydrodynamics Suite
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                PhD Level
              </span>
            </h3>
            <p className="text-[9px] text-slate-400 font-mono">Kolmogorov Cascade • 2D Slicer • Sonifier</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-900/60 border-b border-white/5 text-[10px] font-medium">
            <button
              onClick={() => setActiveTab('spectrum')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'spectrum' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" /> Spectrum
            </button>
            <button
              onClick={() => setActiveTab('slice')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'slice' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" /> 2D Slicer
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'audio' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3 h-3" /> Sonifier
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'telemetry' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3 h-3" /> Telemetry
            </button>
          </div>

          {/* Tab Body Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
            {/* 1. KOLMOGOROV TURBULENCE SPECTRUM */}
            {activeTab === 'spectrum' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-[11px] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Kolmogorov Energy Spectrum E(k) vs Wavenumber k
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">E(k) ~ k^(-5/3)</span>
                </div>

                {/* SVG Chart for E(k) vs k */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 relative h-48 flex items-end">
                  <svg className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio, idx) => (
                      <line
                        key={idx}
                        x1="0"
                        y1={ratio * 160}
                        x2="100%"
                        y2={ratio * 160}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="3 3"
                      />
                    ))}

                    {/* Theoretical Kolmogorov k^(-5/3) Curve (Pink) */}
                    {spectrumData.length > 1 && (
                      <path
                        d={spectrumData.map((d, i) => {
                          const x = (i / (spectrumData.length - 1)) * 360 + 10;
                          const maxE = Math.max(1, ...spectrumData.map(s => s.kolmogorov));
                          const y = 150 - (d.kolmogorov / maxE) * 130;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Simulated Live Energy Spectrum Curve (Cyan) */}
                    {spectrumData.length > 1 && (
                      <path
                        d={spectrumData.map((d, i) => {
                          const x = (i / (spectrumData.length - 1)) * 360 + 10;
                          const maxE = Math.max(0.1, ...spectrumData.map(s => s.energy));
                          const y = 150 - (d.energy / maxE) * 130;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Data Points */}
                    {spectrumData.map((d, i) => {
                      const x = (i / (spectrumData.length - 1)) * 360 + 10;
                      const maxE = Math.max(0.1, ...spectrumData.map(s => s.energy));
                      const y = 150 - (d.energy / maxE) * 130;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#22d3ee"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Legend & Theoretical Explanation */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-white/5 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-cyan-400 rounded" />
                    <span className="text-cyan-300">Simulated E(k)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-pink-500 rounded border border-dashed" />
                    <span className="text-pink-300">Kolmogorov k^(-5/3) Target</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  In 3D isotropic turbulence, kinetic energy cascades down from large scale vortices (small wavenumber $k$) to small dissipation eddies (large $k$) according to Kolmogorov's 1941 empirical power-law relation $E(k) \propto \varepsilon^{2/3} k^{-5/3}$.
                </p>
              </div>
            )}

            {/* 2. 2D PLANAR CROSS-SECTION SLICER */}
            {activeTab === 'slice' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['XY', 'XZ', 'YZ'] as const).map(axis => (
                    <button
                      key={axis}
                      onClick={() => setSliceAxis(axis)}
                      className={`py-1 rounded font-mono text-[10px] transition-all ${
                        sliceAxis === axis ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {axis} Plane
                    </button>
                  ))}
                </div>

                {/* Field Selector */}
                <div className="grid grid-cols-4 gap-1">
                  {(['density', 'vorticity', 'pressure', 'velocity'] as const).map(field => (
                    <button
                      key={field}
                      onClick={() => setSliceField(field)}
                      className={`py-1 capitalize text-[9px] rounded transition-all ${
                        sliceField === field ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 font-semibold' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>

                {/* Slice Depth Slider */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                    <span>Slice Depth ({sliceAxis} index)</span>
                    <span className="font-mono text-cyan-400">{sliceIndex} / 31</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="31"
                    step="1"
                    value={sliceIndex}
                    onChange={(e) => setSliceIndex(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* 2D Canvas Heatmap */}
                <div className="relative bg-black rounded-xl p-2 border border-white/10 flex justify-center items-center">
                  <canvas
                    ref={sliceCanvasRef}
                    width={192}
                    height={192}
                    onMouseMove={handleSliceMouseMove}
                    onMouseLeave={() => setHoveredCell(null)}
                    className="cursor-crosshair rounded border border-white/20 shadow-inner"
                  />
                  {hoveredCell && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-[9px] font-mono border border-cyan-500/30 text-cyan-300">
                      Grid({hoveredCell.x}, {hoveredCell.y}): {hoveredCell.val.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. HYDROACOUSTIC SONIFIER */}
            {activeTab === 'audio' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleAudio}
                      className={`p-2.5 rounded-xl border transition-all ${
                        !isMuted ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-lg shadow-pink-500/20' : 'bg-slate-800 border-white/10 text-slate-400'
                      }`}
                    >
                      {!isMuted ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <div>
                      <h4 className="font-semibold text-xs text-white">Web Audio Plasma Sonifier</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {!isMuted ? 'Synthesizing live cosmic audio...' : 'Audio Muted'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    !isMuted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {!isMuted ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>

                <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Sub-Bass Plasma Resonance:</span>
                    <span className="text-cyan-400">{(40 + Math.sqrt(metrics.kineticEnergy) * 8).toFixed(1)} Hz</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-150"
                      style={{ width: `${Math.min(100, (metrics.kineticEnergy / 80) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-2">
                    <span>Turbulent Shear Noise Bandpass:</span>
                    <span className="text-pink-400">{(200 + metrics.maxVorticity * 800 + (metrics.enstrophy || 0) * 10).toFixed(0)} Hz</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-150"
                      style={{ width: `${Math.min(100, (metrics.maxVorticity / 2) * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Real-time hydrodynamic sonification connects physical simulation invariants ($E_k$, $\Omega$, $\omega$) to Web Audio API sine oscillators and pink-noise bandpass sweeps.
                </p>
              </div>
            )}

            {/* 4. TELEMETRY & CSV DATASET EXPORTER */}
            {activeTab === 'telemetry' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setIsLogging(!isLogging)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${
                      isLogging ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isLogging ? '● REC (Live Logging)' : 'PAUSED'}
                  </button>

                  <button
                    onClick={exportCSV}
                    disabled={snapshots.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-[10px] transition-all disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV Dataset
                  </button>
                </div>

                {/* Telemetry Table */}
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/60 font-mono text-[9px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="p-1.5">Step</th>
                        <th className="p-1.5">Re</th>
                        <th className="p-1.5">E_k</th>
                        <th className="p-1.5">Enstrophy</th>
                        <th className="p-1.5">|ω|_max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {snapshots.slice().reverse().map((s, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-1.5 text-cyan-400">#{s.step}</td>
                          <td className="p-1.5">{s.reynoldsNumber.toFixed(0)}</td>
                          <td className="p-1.5 text-purple-300">{s.kineticEnergy.toFixed(2)}</td>
                          <td className="p-1.5 text-pink-300">{s.enstrophy.toFixed(2)}</td>
                          <td className="p-1.5 text-emerald-300">{s.maxVorticity.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
