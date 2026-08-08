import { ColorPalette, PresetScenario, ViewMode, ForceObjectType, BackgroundMode, BoundingStyle } from '../types';

export const DEFAULT_LIGHTING = {
  ambientLight: 0.35,
  directionalLightIntensity: 0.7,
  lightHue: 200,
  lightAngle: 45,
  specularGlow: 0.6,
  pointLightEmitters: true
};

export const DEFAULT_ENVIRONMENT = {
  backgroundMode: BackgroundMode.DeepSpace,
  boundingStyle: BoundingStyle.WireframeCube,
  starCount: 1000,
  autoRotateCamera: true,
  cameraSpeed: 0.5
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'supernova',
    name: 'Supernova Remnant Shockwave',
    category: 'Astrophysics',
    description: 'Relativistic plasma blast expanding rapidly into interstellar medium, inducing turbulent vorticity Rayleigh-Taylor finger filaments.',
    formula: '\\frac{\\partial \\rho}{\\partial t} + \\nabla \\cdot (\\rho \\vec{u}) = S_{\\text{blast}}',
    physicsBreakdown: 'High kinetic impulse at core with low viscosity creates expanding shell instability, driven by vorticity confinement.',
    config: {
      diffusion: 0.0000005,
      viscosity: 0.0000001,
      dt: 0.15,
      vorticityStrength: 0.8,
      particleCount: 1800,
      viewMode: ViewMode.Hybrid,
      colorPalette: ColorPalette.Supernova,
      autoInjectNoise: true,
      forceObjects: [
        {
          id: 'sn-core',
          type: ForceObjectType.SupernovaEmitter,
          x: 16,
          y: 16,
          z: 16,
          strength: 2.5,
          radius: 7,
          color: '#ff3300',
          active: true
        }
      ],
      lighting: {
        ...DEFAULT_LIGHTING,
        lightHue: 35,
        directionalLightIntensity: 0.95,
        specularGlow: 0.8
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        backgroundMode: BackgroundMode.SolarCorona,
        boundingStyle: BoundingStyle.CyberGlass
      }
    }
  },
  {
    id: 'black-hole-accretion',
    name: 'Keplerian Accretion Disk',
    category: 'Astrophysics',
    description: 'High shear angular momentum swirling into a central SMBH event horizon with polar relativistic plasma jet ejection.',
    formula: '\\Omega(r) = \\sqrt{\\frac{GM}{r^3}}, \\quad \\vec{F}_{\\text{jet}} = -\\nabla p + \\vec{J} \\times \\vec{B}',
    physicsBreakdown: 'Central gravitational attractor combined with azimuthal velocity field generates spiral accretion arm dynamics.',
    config: {
      diffusion: 0.000001,
      viscosity: 0.0000002,
      dt: 0.18,
      vorticityStrength: 1.1,
      particleCount: 2200,
      viewMode: ViewMode.Stardust,
      colorPalette: ColorPalette.AccretionDisk,
      autoInjectNoise: false,
      forceObjects: [
        {
          id: 'bh-singularity',
          type: ForceObjectType.BlackHole,
          x: 16,
          y: 16,
          z: 16,
          strength: 3.0,
          radius: 8,
          color: '#00e5ff',
          active: true
        },
        {
          id: 'bh-jet',
          type: ForceObjectType.CosmicTornado,
          x: 16,
          y: 16,
          z: 16,
          strength: 1.8,
          radius: 6,
          color: '#e040fb',
          active: true
        }
      ],
      lighting: {
        ...DEFAULT_LIGHTING,
        lightHue: 280,
        directionalLightIntensity: 0.85
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        backgroundMode: BackgroundMode.EventHorizon,
        boundingStyle: BoundingStyle.SpatialGrid
      }
    }
  },
  {
    id: 'solar-flare',
    name: 'MHD Solar Coronal Prominence',
    category: 'Astrophysics',
    description: 'Twisted magnetic flux rope triggering coronal mass ejection (CME) loops driven by buoyancy and solar magnetic field reconnection.',
    formula: '\\rho \\left( \\frac{\\partial \\vec{u}}{\\partial t} + \\vec{u} \\cdot \\nabla \\vec{u} \\right) = -\\nabla p + \\rho \\vec{g} + \\vec{J} \\times \\vec{B}',
    physicsBreakdown: 'Thermal buoyancy forces interacting with magnetic tension vectors produce arching plasma promenades.',
    config: {
      diffusion: 0.000002,
      viscosity: 0.0000005,
      dt: 0.12,
      vorticityStrength: 0.6,
      particleCount: 1500,
      viewMode: ViewMode.Vorticity,
      colorPalette: ColorPalette.Aurora,
      autoInjectNoise: true,
      forceObjects: [
        {
          id: 'solar-footprint',
          type: ForceObjectType.Pulsar,
          x: 16,
          y: 4,
          z: 16,
          strength: 2.0,
          radius: 6,
          color: '#00ff88',
          active: true
        }
      ],
      lighting: {
        ...DEFAULT_LIGHTING,
        lightHue: 140,
        directionalLightIntensity: 0.9
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        backgroundMode: BackgroundMode.SolarCorona,
        boundingStyle: BoundingStyle.CoordinateAxes
      }
    }
  },
  {
    id: 'quantum-turbulence',
    name: 'Superfluid Quantum Vortices',
    category: 'Quantum Chaos',
    description: 'Quantized vortex filament tangle in BEC (Bose-Einstein Condensates) governed by Gross-Pitaevskii non-linear fluid dynamics.',
    formula: 'i\\hbar \\frac{\\partial \\psi}{\\partial t} = -\\frac{\\hbar^2}{2m} \\nabla^2 \\psi + g |\\psi|^2 \\psi',
    physicsBreakdown: 'Zero dissipation viscosity limit yields vortex reconnection cascades and chaotic quantum knots.',
    config: {
      diffusion: 0.0,
      viscosity: 0.0,
      dt: 0.22,
      vorticityStrength: 1.5,
      particleCount: 2500,
      viewMode: ViewMode.Vorticity,
      colorPalette: ColorPalette.QuantumPlasma,
      autoInjectNoise: true,
      forceObjects: [],
      lighting: {
        ...DEFAULT_LIGHTING,
        lightHue: 190,
        ambientLight: 0.5
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        backgroundMode: BackgroundMode.QuantumMatrix,
        boundingStyle: BoundingStyle.CyberGlass
      }
    }
  },
  {
    id: 'karman-vortex',
    name: '3D Kármán Vortex Street',
    category: 'Fluid Dynamics',
    description: 'Unsteady flow separation over a bluff body generating alternating periodic vortex shedding arrays.',
    formula: 'St = \\frac{f \\cdot L}{U} \\approx 0.21 \\left( 1 - \\frac{21}{Re} \\right)',
    physicsBreakdown: 'Boundary layer detachment triggers laminar-to-turbulent vortex street transitions at Reynolds numbers > 100.',
    config: {
      diffusion: 0.0000002,
      viscosity: 0.00000005,
      dt: 0.14,
      vorticityStrength: 0.9,
      particleCount: 2000,
      viewMode: ViewMode.Velocity,
      colorPalette: ColorPalette.Nebula,
      autoInjectNoise: true,
      forceObjects: [],
      lighting: {
        ...DEFAULT_LIGHTING,
        lightHue: 210
      },
      environment: {
        ...DEFAULT_ENVIRONMENT,
        backgroundMode: BackgroundMode.CosmicGrid,
        boundingStyle: BoundingStyle.SpatialGrid
      }
    }
  }
];
