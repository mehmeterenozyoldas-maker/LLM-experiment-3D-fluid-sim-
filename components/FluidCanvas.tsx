import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { Fluid } from '../utils/fluidSolver';
import { 
  FluidConfig, 
  FluidMetrics, 
  ViewMode, 
  ColorPalette, 
  ForceObjectType, 
  BackgroundMode, 
  BoundingStyle 
} from '../types';
import { hydroAudio } from '../utils/audioSynth';

interface FluidCanvasProps {
  config: FluidConfig;
  onMetricsUpdate: (metrics: FluidMetrics) => void;
  onCanvasClick?: (gridPos: { x: number; y: number; z: number }) => void;
  fluidRefOut?: React.MutableRefObject<Fluid | null>;
}

const FluidCanvas: React.FC<FluidCanvasProps> = ({ config, onMetricsUpdate, onCanvasClick, fluidRefOut }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const fluidRef = useRef<Fluid | null>(null);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
    if (fluidRef.current) {
      fluidRef.current.updateConfig(
        config.dt,
        config.diffusion,
        config.viscosity,
        config.vorticityStrength
      );
      fluidRef.current.syncParticles(config.particleCount || 1500);
    }
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let fluid: Fluid;
      let t = 0;
      let camAngle = 0;
      const N = 32; // Grid Resolution
      const SCALE = 7; // 3D Cell spacing
      let isInteracting = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      // Background Starfield particles
      const MAX_STARS = 1500;
      const stars: { x: number; y: number; z: number; size: number; speed: number; hue: number }[] = [];

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        fluid = new Fluid(
          configRef.current.dt,
          configRef.current.diffusion,
          configRef.current.viscosity,
          N,
          configRef.current.vorticityStrength
        );
        fluid.syncParticles(configRef.current.particleCount || 1500);
        fluidRef.current = fluid;
        if (fluidRefOut) {
          fluidRefOut.current = fluid;
        }

        // Initialize 3D Starfield Array
        for (let i = 0; i < MAX_STARS; i++) {
          stars.push({
            x: p.random(-800, 800),
            y: p.random(-800, 800),
            z: p.random(-800, 800),
            size: p.random(1, 3.5),
            speed: p.random(0.2, 1.2),
            hue: p.random(180, 280)
          });
        }
        
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.noStroke();
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.mousePressed = () => {
        if (p.mouseX < 340 && p.mouseY < 560) return; // Ignore clicks inside UI control panel
        isInteracting = true;
        prevMouseX = p.mouseX;
        prevMouseY = p.mouseY;

        if (p.keyIsDown(p.SHIFT) && onCanvasClick) {
          onCanvasClick({ x: Math.floor(N / 2), y: Math.floor(N / 2), z: Math.floor(N / 2) });
        }
      };

      p.mouseReleased = () => {
        isInteracting = false;
      };

      // Helper to compute color according to current ColorPalette
      const getPaletteColor = (val: number, normVal: number, palette: ColorPalette) => {
        let hue = 0;
        let sat = 90;
        let bri = Math.min(100, normVal * 100);

        if (palette === ColorPalette.Nebula) {
          hue = (180 + normVal * 140) % 360;
        } else if (palette === ColorPalette.Supernova) {
          hue = Math.min(55, normVal * 60);
          sat = 100 - normVal * 40;
          bri = Math.min(100, normVal * 120);
        } else if (palette === ColorPalette.Aurora) {
          hue = (140 + normVal * 140) % 360;
        } else if (palette === ColorPalette.AccretionDisk) {
          hue = (35 + normVal * 250) % 360;
        } else if (palette === ColorPalette.QuantumPlasma) {
          hue = (200 + normVal * 160) % 360;
          sat = 100;
        }
        return { hue, sat, bri };
      };

      p.draw = () => {
        const currentConfig = configRef.current;
        const env = currentConfig.environment || {
          backgroundMode: BackgroundMode.DeepSpace,
          boundingStyle: BoundingStyle.WireframeCube,
          starCount: 1000,
          autoRotateCamera: true,
          cameraSpeed: 0.5
        };
        const lighting = currentConfig.lighting || {
          ambientLight: 0.35,
          directionalLightIntensity: 0.7,
          lightHue: 200,
          lightAngle: 45,
          specularGlow: 0.6,
          pointLightEmitters: true
        };

        // --- 1. Background Atmosphere Color ---
        if (env.backgroundMode === BackgroundMode.DeepSpace) {
          p.background(240, 40, 4); // Deep pitch obsidian void
        } else if (env.backgroundMode === BackgroundMode.CosmicGrid) {
          p.background(220, 60, 6); // Deep space navy grid
        } else if (env.backgroundMode === BackgroundMode.EventHorizon) {
          p.background(280, 80, 3); // Deep gravitational ultraviolet void
        } else if (env.backgroundMode === BackgroundMode.SolarCorona) {
          p.background(20, 90, 8); // Solar coronal deep amber
        } else if (env.backgroundMode === BackgroundMode.QuantumMatrix) {
          p.background(160, 90, 4); // Quantum cyber emerald dark
        }

        // --- 2. Camera Navigation & Auto-Rotation ---
        if (env.autoRotateCamera && !isInteracting) {
          camAngle += 0.003 * (env.cameraSpeed || 0.5);
          const camR = 400;
          const camX = Math.cos(camAngle) * camR;
          const camZ = Math.sin(camAngle) * camR;
          p.camera(camX, -150, camZ, 0, 0, 0, 0, 1, 0);
        } else {
          p.orbitControl(1, 1, 0.05);
        }

        // --- 3. Render 3D Background Starfield ---
        const starLimit = Math.min(MAX_STARS, env.starCount || 1000);
        p.push();
        p.strokeWeight(1.8);
        for (let i = 0; i < starLimit; i++) {
          const st = stars[i];
          const twinkle = Math.sin(t * st.speed + i) * 30 + 70;
          p.stroke(st.hue, 30, twinkle, 80);
          p.point(st.x, st.y, st.z);
        }
        p.pop();

        // --- 4. WEBGL Lighting Engine Setup ---
        const ambientB = (lighting.ambientLight || 0.35) * 100;
        p.ambientLight(lighting.lightHue || 200, 30, ambientB);

        if (lighting.directionalLightIntensity > 0) {
          const rad = p.radians(lighting.lightAngle || 45);
          const lx = Math.cos(rad);
          const ly = Math.sin(rad);
          const lBri = (lighting.directionalLightIntensity || 0.7) * 100;
          p.directionalLight(lighting.lightHue || 200, 60, lBri, lx, ly, -0.7);
        }

        // --- 5. Direct Mouse Fluid Injection ---
        if (isInteracting && p.mouseIsPressed) {
          const dx = p.mouseX - prevMouseX;
          const dy = p.mouseY - prevMouseY;
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            const midX = Math.floor(N / 2);
            const midY = Math.floor(N / 2);
            const midZ = Math.floor(N / 2);

            for (let kz = -2; kz <= 2; kz++) {
              for (let ky = -2; ky <= 2; ky++) {
                for (let kx = -2; kx <= 2; kx++) {
                  fluid.addDensity(midX + kx, midY + ky, midZ + kz, 120);
                  fluid.addVelocity(midX + kx, midY + ky, midZ + kz, dx * 0.4, dy * 0.4, (dx + dy) * 0.2);
                }
              }
            }
          }
          prevMouseX = p.mouseX;
          prevMouseY = p.mouseY;
        }

        // --- 6. Ambient Cosmic Noise Injector ---
        if (currentConfig.autoInjectNoise) {
          const cx = Math.floor(0.5 * N);
          const cy = Math.floor(0.5 * N);
          const cz = Math.floor(0.5 * N);
          
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                fluid.addDensity(cx + i, cy + j, cz + k, p.random(30, 90));
                
                const angleX = p.noise(t) * p.TWO_PI * 2;
                const angleY = p.noise(t + 100) * p.TWO_PI * 2;
                const v = p5.Vector.fromAngles(angleX, angleY);
                v.mult(1.8);
                
                const vz = Math.sin(p.noise(t + 200) * p.TWO_PI) * 1.8;
                fluid.addVelocity(cx + i, cy + j, cz + k, v.x, v.y, vz);
              }
            }
          }
        }

        // --- 7. Process Force Objects & Attractors ---
        if (currentConfig.forceObjects && currentConfig.forceObjects.length > 0) {
          fluid.applyForceObjects(currentConfig.forceObjects);
        }

        t += 0.01;
        fluid.step();

        // --- 8. Render Bounding Style & Grid Framework ---
        p.push();
        p.translate(-N * SCALE / 2, -N * SCALE / 2, -N * SCALE / 2);
        
        const style = env.boundingStyle || BoundingStyle.WireframeCube;

        if (style === BoundingStyle.WireframeCube) {
          p.noFill();
          p.stroke(200, 40, 60, 30);
          p.strokeWeight(1);
          p.box(N * SCALE, N * SCALE, N * SCALE);
        } else if (style === BoundingStyle.SpatialGrid) {
          // Inner 3D Floor & Back Plane Grids
          p.stroke(180, 50, 80, 20);
          p.strokeWeight(0.8);
          const step = (N * SCALE) / 8;
          for (let g = 0; g <= N * SCALE; g += step) {
            p.line(g, 0, 0, g, N * SCALE, 0);
            p.line(0, g, 0, N * SCALE, g, 0);
            p.line(g, 0, 0, g, 0, N * SCALE);
            p.line(0, 0, g, N * SCALE, 0, g);
          }
        } else if (style === BoundingStyle.CoordinateAxes) {
          // Color-coded X, Y, Z Vector Axes
          p.strokeWeight(2.5);
          p.stroke(0, 100, 100, 90); // Red X
          p.line(0, 0, 0, N * SCALE * 1.1, 0, 0);
          p.stroke(120, 100, 100, 90); // Green Y
          p.line(0, 0, 0, 0, N * SCALE * 1.1, 0);
          p.stroke(240, 100, 100, 90); // Blue Z
          p.line(0, 0, 0, 0, 0, N * SCALE * 1.1);
        } else if (style === BoundingStyle.CyberGlass) {
          p.noFill();
          p.stroke(300, 80, 90, 50);
          p.strokeWeight(1.5);
          p.box(N * SCALE, N * SCALE, N * SCALE);
        }

        // --- 9. Force Object Gizmos & Point Lights ---
        if (currentConfig.forceObjects) {
          for (const forceObj of currentConfig.forceObjects) {
            if (!forceObj.active) continue;
            const fx = forceObj.x * SCALE;
            const fy = forceObj.y * SCALE;
            const fz = forceObj.z * SCALE;

            if (lighting.pointLightEmitters) {
              const hue = forceObj.type === ForceObjectType.BlackHole ? 190 : 320;
              p.pointLight(hue, 90, 100, fx - N * SCALE / 2, fy - N * SCALE / 2, fz - N * SCALE / 2);
            }

            p.push();
            p.translate(fx, fy, fz);
            p.noFill();
            if (forceObj.type === ForceObjectType.BlackHole) {
              p.stroke(190, 100, 100, 80);
              p.sphere(forceObj.radius * 2);
              p.stroke(300, 100, 100, 90);
              p.ellipse(0, 0, forceObj.radius * 6, forceObj.radius * 6);
            } else if (forceObj.type === ForceObjectType.Pulsar) {
              p.stroke(140, 100, 100, 90);
              p.box(forceObj.radius * 3);
            } else if (forceObj.type === ForceObjectType.CosmicTornado) {
              p.stroke(280, 100, 100, 90);
              p.torus(forceObj.radius * 3, 2);
            } else if (forceObj.type === ForceObjectType.SupernovaEmitter) {
              p.stroke(30, 100, 100, 90);
              p.sphere(forceObj.radius * 3);
            }
            p.pop();
          }
        }

        // --- 10. Render Fluid Field according to ViewMode ---
        const viewMode = currentConfig.viewMode;
        const palette = currentConfig.colorPalette;

        // MODE A: DENSITY CLOUD or HYBRID
        if (viewMode === ViewMode.Density || viewMode === ViewMode.Hybrid) {
          for (let k = 0; k < N; k++) {
            for (let j = 0; j < N; j++) {
              for (let i = 0; i < N; i++) {
                const idx = fluid.IX(i, j, k);
                const d = fluid.density[idx];
                if (d > 4) {
                  const normD = d / 255;
                  const { hue, sat, bri } = getPaletteColor(d, normD, palette);
                  p.stroke(hue, sat, bri, Math.min(100, d * 0.8));
                  p.strokeWeight(SCALE * (0.8 + normD * 1.2));
                  p.point(i * SCALE, j * SCALE, k * SCALE);
                }
              }
            }
          }
        }

        // MODE B: VELOCITY FIELD VECTORS
        if (viewMode === ViewMode.Velocity) {
          p.strokeWeight(1.5);
          for (let k = 1; k < N - 1; k += 2) {
            for (let j = 1; j < N - 1; j += 2) {
              for (let i = 1; i < N - 1; i += 2) {
                const idx = fluid.IX(i, j, k);
                const vx = fluid.Vx[idx];
                const vy = fluid.Vy[idx];
                const vz = fluid.Vz[idx];
                const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

                if (speed > 0.05) {
                  const normSpeed = Math.min(1, speed / 3);
                  const { hue, sat, bri } = getPaletteColor(speed, normSpeed, palette);
                  
                  const px = i * SCALE;
                  const py = j * SCALE;
                  const pz = k * SCALE;

                  p.stroke(hue, sat, bri, 80);
                  p.line(px, py, pz, px + vx * 6, py + vy * 6, pz + vz * 6);
                }
              }
            }
          }
        }

        // MODE C: VORTICITY / TURBULENCE HEATMAP
        if (viewMode === ViewMode.Vorticity) {
          const maxW = fluid.maxVorticity || 1;
          for (let k = 1; k < N - 1; k++) {
            for (let j = 1; j < N - 1; j++) {
              for (let i = 1; i < N - 1; i++) {
                const idx = fluid.IX(i, j, k);
                const w = fluid.vorticityMag[idx];
                if (w > 0.02) {
                  const normW = Math.min(1, w / maxW);
                  const { hue, sat, bri } = getPaletteColor(w, normW, palette);
                  p.stroke(hue, sat, bri, normW * 90);
                  p.strokeWeight(SCALE * (0.5 + normW * 1.5));
                  p.point(i * SCALE, j * SCALE, k * SCALE);
                }
              }
            }
          }
        }

        // MODE D: PRESSURE FIELD GRADIENT
        if (viewMode === ViewMode.Pressure) {
          for (let k = 1; k < N - 1; k += 2) {
            for (let j = 1; j < N - 1; j += 2) {
              for (let i = 1; i < N - 1; i += 2) {
                const idx = fluid.IX(i, j, k);
                const pVal = fluid.pressure[idx];
                const absP = Math.abs(pVal);
                if (absP > 0.001) {
                  const normP = Math.min(1, absP * 10);
                  const hue = pVal >= 0 ? 10 : 210;
                  p.stroke(hue, 90, normP * 100, normP * 85);
                  p.strokeWeight(SCALE * (0.6 + normP * 1.2));
                  p.point(i * SCALE, j * SCALE, k * SCALE);
                }
              }
            }
          }
        }

        // MODE E: STARDUST TRACER SWARM
        if (viewMode === ViewMode.Stardust || viewMode === ViewMode.Hybrid) {
          for (let i = 0; i < fluid.particles.length; i++) {
            const pt = fluid.particles[i];
            const alpha = (pt.life / pt.maxLife) * 90;
            const speed = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy + pt.vz * pt.vz);
            const normSpeed = Math.min(1, speed / 2);
            
            const { hue, sat, bri } = getPaletteColor(speed, normSpeed, palette);

            p.stroke(hue, sat, bri, alpha);
            p.strokeWeight(3 + normSpeed * 3);
            const px = pt.x * SCALE;
            const py = pt.y * SCALE;
            const pz = pt.z * SCALE;
            p.point(px, py, pz);

            p.stroke(hue, sat, bri, alpha * 0.4);
            p.strokeWeight(1);
            p.line(px, py, pz, px - pt.vx * 3, py - pt.vy * 3, pz - pt.vz * 3);
          }
        }

        p.pop();

        fluid.fadeD();

        hydroAudio.updateTelemetry(fluid.kineticEnergy, fluid.enstrophy, fluid.maxVorticity);

        if (p.frameCount % 15 === 0) {
          onMetricsUpdate({
            fps: Math.floor(p.frameRate()),
            reynoldsNumber: fluid.reynoldsNumber,
            kineticEnergy: fluid.kineticEnergy,
            maxVorticity: fluid.maxVorticity,
            enstrophy: fluid.enstrophy,
            activeParticles: fluid.particles.length
          });
        }
      };
    };

    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
    }

    p5InstanceRef.current = new p5(sketch, containerRef.current);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 cursor-crosshair" />;
};

export default FluidCanvas;
