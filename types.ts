export enum ViewMode {
  Density = 'DENSITY',
  Velocity = 'VELOCITY',
  Vorticity = 'VORTICITY',
  Pressure = 'PRESSURE',
  Stardust = 'STARDUST',
  Hybrid = 'HYBRID'
}

export enum ColorPalette {
  Nebula = 'NEBULA',
  Supernova = 'SUPERNOVA',
  Aurora = 'AURORA',
  AccretionDisk = 'ACCRETION_DISK',
  QuantumPlasma = 'QUANTUM_PLASMA'
}

export enum ForceObjectType {
  BlackHole = 'BLACK_HOLE',
  Pulsar = 'PULSAR',
  CosmicTornado = 'COSMIC_TORNADO',
  SupernovaEmitter = 'SUPERNOVA_EMITTER'
}

export interface ForceObject {
  id: string;
  type: ForceObjectType;
  x: number; // Grid index 0 to N-1
  y: number;
  z: number;
  strength: number;
  radius: number;
  color: string;
  active: boolean;
}

export enum BackgroundMode {
  DeepSpace = 'DEEP_SPACE',
  CosmicGrid = 'COSMIC_GRID',
  EventHorizon = 'EVENT_HORIZON',
  SolarCorona = 'SOLAR_CORONA',
  QuantumMatrix = 'QUANTUM_MATRIX'
}

export enum BoundingStyle {
  WireframeCube = 'WIREFRAME_CUBE',
  SpatialGrid = 'SPATIAL_GRID',
  CoordinateAxes = 'COORDINATE_AXES',
  CyberGlass = 'CYBER_GLASS',
  Minimal = 'MINIMAL'
}

export interface LightingConfig {
  ambientLight: number; // 0.0 - 1.0
  directionalLightIntensity: number; // 0.0 - 1.0
  lightHue: number; // 0 - 360
  lightAngle: number; // Rotation angle in deg
  specularGlow: number; // 0.0 - 1.0
  pointLightEmitters: boolean; // Emit point lights from Black Holes / Pulsars
}

export interface EnvironmentConfig {
  backgroundMode: BackgroundMode;
  boundingStyle: BoundingStyle;
  starCount: number; // 0 - 2000
  autoRotateCamera: boolean;
  cameraSpeed: number; // 0.1 - 2.0
}

export interface FluidConfig {
  diffusion: number;
  viscosity: number;
  dt: number;
  fadeRate: number;
  solverIterations: number;
  vorticityStrength: number;
  particleCount: number;
  viewMode: ViewMode;
  colorPalette: ColorPalette;
  autoInjectNoise: boolean;
  forceObjects: ForceObject[];
  lighting: LightingConfig;
  environment: EnvironmentConfig;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  suggestedAction?: Partial<FluidConfig>;
}

export interface PresetScenario {
  id: string;
  name: string;
  category: 'Astrophysics' | 'Fluid Dynamics' | 'Quantum Chaos';
  description: string;
  formula: string;
  physicsBreakdown: string;
  config: Partial<FluidConfig>;
}

export interface FluidMetrics {
  fps: number;
  reynoldsNumber: number;
  kineticEnergy: number;
  maxVorticity: number;
  enstrophy?: number;
  activeParticles: number;
}

export interface TelemetrySnapshot {
  timestamp: string;
  step: number;
  fps: number;
  reynoldsNumber: number;
  kineticEnergy: number;
  enstrophy: number;
  maxVorticity: number;
}

