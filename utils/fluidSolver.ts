// 3D Fluid Solver based on Jos Stam's Real-Time Fluid Dynamics for Games & Astrophysical Extensions
// Enhanced with Vorticity Confinement, Pressure Field Solvers, Trilinear Advected Particle Swarms, and Force Attractors

import { ForceObject, ForceObjectType } from '../types';

export interface StardustParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  hue: number;
}

export class Fluid {
  size: number;
  dt: number;
  diff: number;
  visc: number;
  vorticityStrength: number;
  
  s: number[];
  density: number[];
  pressure: number[];
  vorticityX: number[];
  vorticityY: number[];
  vorticityZ: number[];
  vorticityMag: number[];
  
  Vx: number[];
  Vy: number[];
  Vz: number[];

  Vx0: number[];
  Vy0: number[];
  Vz0: number[];
  
  iter: number; // Solver iterations
  particles: StardustParticle[];
  
  // Metrics
  kineticEnergy: number = 0;
  maxVorticity: number = 0;
  enstrophy: number = 0;
  reynoldsNumber: number = 0;

  constructor(dt: number, diffusion: number, viscosity: number, size: number, vorticityStrength: number = 0.5) {
    this.size = size;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;
    this.vorticityStrength = vorticityStrength;
    this.iter = 5; // Balanced for real-time accuracy and performance
    
    const N = this.size;
    const count = N * N * N;
    
    this.s = new Array(count).fill(0);
    this.density = new Array(count).fill(0);
    this.pressure = new Array(count).fill(0);
    
    this.vorticityX = new Array(count).fill(0);
    this.vorticityY = new Array(count).fill(0);
    this.vorticityZ = new Array(count).fill(0);
    this.vorticityMag = new Array(count).fill(0);
    
    this.Vx = new Array(count).fill(0);
    this.Vy = new Array(count).fill(0);
    this.Vz = new Array(count).fill(0);
    
    this.Vx0 = new Array(count).fill(0);
    this.Vy0 = new Array(count).fill(0);
    this.Vz0 = new Array(count).fill(0);

    this.particles = [];
  }

  updateConfig(dt: number, diff: number, visc: number, vorticityStrength: number = 0.5) {
    this.dt = dt;
    this.diff = diff;
    this.visc = visc;
    this.vorticityStrength = vorticityStrength;
  }

  // --- Stardust Particle Swarm Management ---
  syncParticles(targetCount: number) {
    const N = this.size;
    while (this.particles.length < targetCount) {
      this.particles.push({
        x: Math.random() * (N - 2) + 1,
        y: Math.random() * (N - 2) + 1,
        z: Math.random() * (N - 2) + 1,
        vx: 0,
        vy: 0,
        vz: 0,
        life: Math.random() * 200 + 100,
        maxLife: 300,
        hue: Math.random() * 360
      });
    }
    if (this.particles.length > targetCount) {
      this.particles.length = targetCount;
    }
  }

  updateParticles() {
    const N = this.size;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= 1;

      if (p.life <= 0 || p.x < 0.5 || p.x > N - 1.5 || p.y < 0.5 || p.y > N - 1.5 || p.z < 0.5 || p.z > N - 1.5) {
        // Respawn near high density or random center region
        p.x = N / 2 + (Math.random() - 0.5) * (N * 0.4);
        p.y = N / 2 + (Math.random() - 0.5) * (N * 0.4);
        p.z = N / 2 + (Math.random() - 0.5) * (N * 0.4);
        p.life = Math.random() * 200 + 100;
        p.maxLife = p.life;
        p.hue = (p.x * 10 + p.y * 10 + p.z * 10) % 360;
      }

      // Trilinear Velocity Interpolation
      const vel = this.sampleVelocityTrilinear(p.x, p.y, p.z);
      p.vx = p.vx * 0.8 + vel.vx * 0.2;
      p.vy = p.vy * 0.8 + vel.vy * 0.2;
      p.vz = p.vz * 0.8 + vel.vz * 0.2;

      p.x += p.vx * this.dt;
      p.y += p.vy * this.dt;
      p.z += p.vz * this.dt;
    }
  }

  sampleVelocityTrilinear(x: number, y: number, z: number) {
    const N = this.size;
    const xClamped = Math.max(1, Math.min(N - 2, x));
    const yClamped = Math.max(1, Math.min(N - 2, y));
    const zClamped = Math.max(1, Math.min(N - 2, z));

    const i0 = Math.floor(xClamped);
    const j0 = Math.floor(yClamped);
    const k0 = Math.floor(zClamped);

    const fx = xClamped - i0;
    const fy = yClamped - j0;
    const fz = zClamped - k0;

    const sample = (arr: number[]) => {
      const c000 = arr[this.IX(i0, j0, k0)];
      const c100 = arr[this.IX(i0 + 1, j0, k0)];
      const c010 = arr[this.IX(i0, j0 + 1, k0)];
      const c110 = arr[this.IX(i0 + 1, j0 + 1, k0)];
      const c001 = arr[this.IX(i0, j0, k0 + 1)];
      const c101 = arr[this.IX(i0 + 1, j0, k0 + 1)];
      const c011 = arr[this.IX(i0, j0 + 1, k0 + 1)];
      const c111 = arr[this.IX(i0 + 1, j0 + 1, k0 + 1)];

      const c00 = c000 * (1 - fx) + c100 * fx;
      const c01 = c001 * (1 - fx) + c101 * fx;
      const c10 = c010 * (1 - fx) + c110 * fx;
      const c11 = c011 * (1 - fx) + c111 * fx;

      const c0 = c00 * (1 - fy) + c10 * fy;
      const c1 = c01 * (1 - fy) + c11 * fy;

      return c0 * (1 - fz) + c1 * fz;
    };

    return {
      vx: sample(this.Vx),
      vy: sample(this.Vy),
      vz: sample(this.Vz)
    };
  }

  // --- External Forces & Cosmic Attractors ---
  applyForceObjects(forces: ForceObject[]) {
    if (!forces || forces.length === 0) return;
    const N = this.size;

    for (const f of forces) {
      if (!f.active) continue;

      const fx = Math.floor(f.x);
      const fy = Math.floor(f.y);
      const fz = Math.floor(f.z);
      const radius = f.radius || 5;

      for (let k = Math.max(1, fz - radius); k <= Math.min(N - 2, fz + radius); k++) {
        for (let j = Math.max(1, fy - radius); j <= Math.min(N - 2, fy + radius); j++) {
          for (let i = Math.max(1, fx - radius); i <= Math.min(N - 2, fx + radius); i++) {
            const dx = i - fx;
            const dy = j - fy;
            const dz = k - fz;
            const distSq = dx * dx + dy * dy + dz * dz + 0.001;
            const dist = Math.sqrt(distSq);

            if (dist > radius) continue;

            const factor = (1 - dist / radius) * f.strength;
            const idx = this.IX(i, j, k);

            if (f.type === ForceObjectType.BlackHole) {
              // Pull inward + inject density
              this.Vx[idx] -= (dx / dist) * factor * 1.5;
              this.Vy[idx] -= (dy / dist) * factor * 1.5;
              this.Vz[idx] -= (dz / dist) * factor * 1.5;
              this.density[idx] += factor * 20;
            } else if (f.type === ForceObjectType.Pulsar) {
              // Repel outward
              this.Vx[idx] += (dx / dist) * factor * 2.0;
              this.Vy[idx] += (dy / dist) * factor * 2.0;
              this.Vz[idx] += (dz / dist) * factor * 2.0;
            } else if (f.type === ForceObjectType.CosmicTornado) {
              // Tangential rotational force (spin in XY plane, jet in Z)
              this.Vx[idx] += -dy * factor * 0.3;
              this.Vy[idx] += dx * factor * 0.3;
              this.Vz[idx] += factor * 0.5;
              this.density[idx] += factor * 15;
            } else if (f.type === ForceObjectType.SupernovaEmitter) {
              // High outward impulse + burst density
              this.Vx[idx] += (dx / dist) * factor * 3.0;
              this.Vy[idx] += (dy / dist) * factor * 3.0;
              this.Vz[idx] += (dz / dist) * factor * 3.0;
              this.density[idx] += factor * 40;
            }
          }
        }
      }
    }
  }

  // --- Vorticity Confinement Calculation ---
  computeVorticityConfinement() {
    const N = this.size;
    if (this.vorticityStrength <= 0) return;

    // 1. Compute Curl omega = curl(V)
    let maxW = 0;
    for (let k = 1; k < N - 1; k++) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = this.IX(i, j, k);

          const dw_dy = (this.Vz[this.IX(i, j + 1, k)] - this.Vz[this.IX(i, j - 1, k)]) * 0.5;
          const dv_dz = (this.Vy[this.IX(i, j, k + 1)] - this.Vy[this.IX(i, j, k - 1)]) * 0.5;

          const du_dz = (this.Vx[this.IX(i, j, k + 1)] - this.Vx[this.IX(i, j, k - 1)]) * 0.5;
          const dw_dx = (this.Vz[this.IX(i + 1, j, k)] - this.Vz[this.IX(i - 1, j, k)]) * 0.5;

          const dv_dx = (this.Vy[this.IX(i + 1, j, k)] - this.Vy[this.IX(i - 1, j, k)]) * 0.5;
          const du_dy = (this.Vx[this.IX(i, j + 1, k)] - this.Vx[this.IX(i, j - 1, k)]) * 0.5;

          const wx = dw_dy - dv_dz;
          const wy = du_dz - dw_dx;
          const wz = dv_dx - du_dy;

          const wmag = Math.sqrt(wx * wx + wy * wy + wz * wz);

          this.vorticityX[idx] = wx;
          this.vorticityY[idx] = wy;
          this.vorticityZ[idx] = wz;
          this.vorticityMag[idx] = wmag;

          if (wmag > maxW) maxW = wmag;
        }
      }
    }
    this.maxVorticity = maxW;

    // 2. Apply confinement force F_vort = eps * (N x omega)
    const eps = this.vorticityStrength * 0.5;

    for (let k = 2; k < N - 2; k++) {
      for (let j = 2; j < N - 2; j++) {
        for (let i = 2; i < N - 2; i++) {
          const idx = this.IX(i, j, k);

          const dw_dx = (this.vorticityMag[this.IX(i + 1, j, k)] - this.vorticityMag[this.IX(i - 1, j, k)]) * 0.5;
          const dw_dy = (this.vorticityMag[this.IX(i, j + 1, k)] - this.vorticityMag[this.IX(i, j - 1, k)]) * 0.5;
          const dw_dz = (this.vorticityMag[this.IX(i, j, k + 1)] - this.vorticityMag[this.IX(i, j, k - 1)]) * 0.5;

          const len = Math.sqrt(dw_dx * dw_dx + dw_dy * dw_dy + dw_dz * dw_dz) + 0.00001;

          const Nx = dw_dx / len;
          const Ny = dw_dy / len;
          const Nz = dw_dz / len;

          const wx = this.vorticityX[idx];
          const wy = this.vorticityY[idx];
          const wz = this.vorticityZ[idx];

          // Cross product N x omega
          const Fx = (Ny * wz - Nz * wy) * eps;
          const Fy = (Nz * wx - Nx * wz) * eps;
          const Fz = (Nx * wy - Ny * wx) * eps;

          this.Vx[idx] += Fx * this.dt;
          this.Vy[idx] += Fy * this.dt;
          this.Vz[idx] += Fz * this.dt;
        }
      }
    }
  }

  // --- Compute Physical Metrics ---
  computeMetrics() {
    const N = this.size;
    let totalKE = 0;
    let totalEnstrophy = 0;
    let totalSpeed = 0;
    let count = 0;

    for (let i = 0; i < this.Vx.length; i++) {
      const vx = this.Vx[i];
      const vy = this.Vy[i];
      const vz = this.Vz[i];
      const speedSq = vx * vx + vy * vy + vz * vz;
      totalKE += speedSq;
      totalSpeed += Math.sqrt(speedSq);

      const wx = this.vorticityX[i] || 0;
      const wy = this.vorticityY[i] || 0;
      const wz = this.vorticityZ[i] || 0;
      totalEnstrophy += (wx * wx + wy * wy + wz * wz);

      count++;
    }

    this.kineticEnergy = totalKE * 0.5;
    this.enstrophy = totalEnstrophy * 0.5;
    const avgSpeed = totalSpeed / (count || 1);
    const characteristicLength = N;
    const effVisc = Math.max(0.0000001, this.visc);
    this.reynoldsNumber = (avgSpeed * characteristicLength) / effVisc;
  }

  // --- Kolmogorov Energy Cascade Spectrum E(k) vs Wavenumber k ---
  getEnergySpectrum(): { k: number; energy: number; kolmogorov: number }[] {
    const N = this.size;
    const maxK = Math.floor(N / 2);
    const energyShells = new Float32Array(maxK + 1);
    const shellCounts = new Int32Array(maxK + 1);

    // Approximate spatial Fourier wave energy via shell decomposition
    for (let k = 1; k < N - 1; k++) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = this.IX(i, j, k);
          const vx = this.Vx[idx];
          const vy = this.Vy[idx];
          const vz = this.Vz[idx];
          const ke = 0.5 * (vx * vx + vy * vy + vz * vz);

          // Wavenumber distance from grid center frequency
          const kx = i - N / 2;
          const ky = j - N / 2;
          const kz = k - N / 2;
          const kMag = Math.round(Math.sqrt(kx * kx + ky * ky + kz * kz));

          if (kMag >= 1 && kMag <= maxK) {
            energyShells[kMag] += ke;
            shellCounts[kMag]++;
          }
        }
      }
    }

    // Normalize and construct Kolmogorov k^(-5/3) theoretical curve
    const result = [];
    const baseEnergy = Math.max(0.1, energyShells[1] || this.kineticEnergy * 0.1);

    for (let k = 1; k <= maxK; k++) {
      const avgE = shellCounts[k] > 0 ? energyShells[k] / shellCounts[k] : 0;
      // Kolmogorov -5/3 energy cascade law: E(k) ~ C_k * k^(-5/3)
      const kolmogorovE = baseEnergy * Math.pow(k, -5 / 3);

      result.push({
        k,
        energy: avgE,
        kolmogorov: kolmogorovE
      });
    }

    return result;
  }

  // --- 2D Planar Cross-Section Slicer (XY, XZ, YZ Planes) ---
  getSliceData(
    axis: 'XY' | 'XZ' | 'YZ',
    sliceIndex: number,
    field: 'density' | 'vorticity' | 'pressure' | 'velocity'
  ): { matrix: number[][]; width: number; height: number; minVal: number; maxVal: number } {
    const N = this.size;
    const idxClamped = Math.max(0, Math.min(N - 1, Math.floor(sliceIndex)));
    const matrix: number[][] = [];

    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let row = 0; row < N; row++) {
      const rowVals: number[] = [];
      for (let col = 0; col < N; col++) {
        let i = 0, j = 0, k = 0;
        if (axis === 'XY') {
          i = col; j = row; k = idxClamped;
        } else if (axis === 'XZ') {
          i = col; j = idxClamped; k = row;
        } else if (axis === 'YZ') {
          i = idxClamped; j = col; k = row;
        }

        const gridIdx = this.IX(i, j, k);
        let val = 0;

        if (field === 'density') {
          val = this.density[gridIdx];
        } else if (field === 'vorticity') {
          val = this.vorticityMag[gridIdx] || 0;
        } else if (field === 'pressure') {
          val = this.pressure[gridIdx] || 0;
        } else if (field === 'velocity') {
          const vx = this.Vx[gridIdx];
          const vy = this.Vy[gridIdx];
          const vz = this.Vz[gridIdx];
          val = Math.sqrt(vx * vx + vy * vy + vz * vz);
        }

        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;

        rowVals.push(val);
      }
      matrix.push(rowVals);
    }

    return {
      matrix,
      width: N,
      height: N,
      minVal: minVal === Infinity ? 0 : minVal,
      maxVal: maxVal === -Infinity ? 1 : maxVal
    };
  }

  // --- 1D Probe Profile Beam Extractor ---
  getProbeProfile(
    axis: 'X' | 'Y' | 'Z',
    fixed1: number,
    fixed2: number
  ): { index: number; density: number; velocity: number; vorticity: number; pressure: number }[] {
    const N = this.size;
    const f1 = Math.max(0, Math.min(N - 1, Math.floor(fixed1)));
    const f2 = Math.max(0, Math.min(N - 1, Math.floor(fixed2)));
    const profile = [];

    for (let pos = 0; pos < N; pos++) {
      let i = 0, j = 0, k = 0;
      if (axis === 'X') {
        i = pos; j = f1; k = f2;
      } else if (axis === 'Y') {
        i = f1; j = pos; k = f2;
      } else if (axis === 'Z') {
        i = f1; j = f2; k = pos;
      }

      const gridIdx = this.IX(i, j, k);
      const vx = this.Vx[gridIdx];
      const vy = this.Vy[gridIdx];
      const vz = this.Vz[gridIdx];
      const velMag = Math.sqrt(vx * vx + vy * vy + vz * vz);

      profile.push({
        index: pos,
        density: this.density[gridIdx],
        velocity: velMag,
        vorticity: this.vorticityMag[gridIdx] || 0,
        pressure: this.pressure[gridIdx] || 0
      });
    }

    return profile;
  }

  step() {
    const dt = this.dt;
    const diff = this.diff;
    const visc = this.visc;

    // 1. Vorticity Confinement
    this.computeVorticityConfinement();

    // 2. Diffuse Velocity
    this.diffuse(1, this.Vx0, this.Vx, visc, dt);
    this.diffuse(2, this.Vy0, this.Vy, visc, dt);
    this.diffuse(3, this.Vz0, this.Vz, visc, dt);
    
    // 3. Project Velocity
    this.project(this.Vx0, this.Vy0, this.Vz0, this.Vx, this.Vy);
    
    // 4. Advect Velocity
    this.advect(1, this.Vx, this.Vx0, this.Vx0, this.Vy0, this.Vz0, dt);
    this.advect(2, this.Vy, this.Vy0, this.Vx0, this.Vy0, this.Vz0, dt);
    this.advect(3, this.Vz, this.Vz0, this.Vx0, this.Vy0, this.Vz0, dt);
    
    // 5. Project Velocity
    this.project(this.Vx, this.Vy, this.Vz, this.Vx0, this.Vy0);
    
    // 6. Diffuse & Advect Density
    this.diffuse(0, this.s, this.density, diff, dt);
    this.advect(0, this.density, this.s, this.Vx, this.Vy, this.Vz, dt);

    // 7. Update Particles
    this.updateParticles();

    // 8. Compute Physical Metrics
    this.computeMetrics();
  }

  addDensity(x: number, y: number, z: number, amount: number) {
    const index = this.IX(x, y, z);
    this.density[index] += amount;
    if (this.density[index] > 255) this.density[index] = 255;
  }

  addVelocity(x: number, y: number, z: number, amountX: number, amountY: number, amountZ: number) {
    const index = this.IX(x, y, z);
    this.Vx[index] += amountX;
    this.Vy[index] += amountY;
    this.Vz[index] += amountZ;
  }
  
  fadeD() {
    for (let i = 0; i < this.density.length; i++) {
      this.density[i] *= 0.96;
    }
  }

  IX(x: number, y: number, z: number) {
    if (x < 0) x = 0; if (x >= this.size) x = this.size - 1;
    if (y < 0) y = 0; if (y >= this.size) y = this.size - 1;
    if (z < 0) z = 0; if (z >= this.size) z = this.size - 1;
    return x + y * this.size + z * this.size * this.size;
  }

  lin_solve(b: number, x: number[], x0: number[], a: number, c: number) {
    const cRecip = 1.0 / c;
    const N = this.size;
    
    for (let k = 0; k < this.iter; k++) {
      for (let m = 1; m < N - 1; m++) {
        for (let j = 1; j < N - 1; j++) {
          for (let i = 1; i < N - 1; i++) {
              x[this.IX(i, j, m)] =
                  (x0[this.IX(i, j, m)] +
                      a * (
                          x[this.IX(i + 1, j, m)] +
                          x[this.IX(i - 1, j, m)] +
                          x[this.IX(i, j + 1, m)] +
                          x[this.IX(i, j - 1, m)] +
                          x[this.IX(i, j, m + 1)] +
                          x[this.IX(i, j, m - 1)]
                      )) * cRecip;
          }
        }
      }
      this.set_bnd(b, x);
    }
  }

  diffuse(b: number, x: number[], x0: number[], diff: number, dt: number) {
    const N = this.size;
    const a = dt * diff * (N - 2) * (N - 2);
    this.lin_solve(b, x, x0, a, 1 + 6 * a);
  }

  project(velocX: number[], velocY: number[], velocZ: number[], p: number[], div: number[]) {
      const N = this.size;
      for (let k = 1; k < N - 1; k++) {
          for (let j = 1; j < N - 1; j++) {
              for (let i = 1; i < N - 1; i++) {
                  div[this.IX(i, j, k)] = -0.5 * (
                       velocX[this.IX(i + 1, j, k)] - velocX[this.IX(i - 1, j, k)] +
                       velocY[this.IX(i, j + 1, k)] - velocY[this.IX(i, j - 1, k)] +
                       velocZ[this.IX(i, j, k + 1)] - velocZ[this.IX(i, j, k - 1)]
                  ) / N;
                  p[this.IX(i, j, k)] = 0;
              }
          }
      }
      this.set_bnd(0, div);
      this.set_bnd(0, p);
      this.lin_solve(0, p, div, 1, 6);
      
      // Store calculated pressure field
      for (let i = 0; i < p.length; i++) {
        this.pressure[i] = p[i];
      }

      for (let k = 1; k < N - 1; k++) {
          for (let j = 1; j < N - 1; j++) {
              for (let i = 1; i < N - 1; i++) {
                  velocX[this.IX(i, j, k)] -= 0.5 * N * (p[this.IX(i + 1, j, k)] - p[this.IX(i - 1, j, k)]);
                  velocY[this.IX(i, j, k)] -= 0.5 * N * (p[this.IX(i, j + 1, k)] - p[this.IX(i, j - 1, k)]);
                  velocZ[this.IX(i, j, k)] -= 0.5 * N * (p[this.IX(i, j, k + 1)] - p[this.IX(i, j, k - 1)]);
              }
          }
      }
      this.set_bnd(1, velocX);
      this.set_bnd(2, velocY);
      this.set_bnd(3, velocZ);
  }

  advect(b: number, d: number[], d0: number[], velocX: number[], velocY: number[], velocZ: number[], dt: number) {
    const N = this.size;
    let i0, i1, j0, j1, k0, k1;
    
    const dtx = dt * (N - 2);
    const dty = dt * (N - 2);
    const dtz = dt * (N - 2);
    
    let s0, s1, t0, t1, u0, u1;
    let tmp1, tmp2, tmp3, x, y, z;
    
    const Nfloat = N;
    let ifloat, jfloat, kfloat;
    let i, j, k;
    
    for(k = 1, kfloat = 1; k < N - 1; k++, kfloat++) {
        for(j = 1, jfloat = 1; j < N - 1; j++, jfloat++) {
            for(i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
                tmp1 = dtx * velocX[this.IX(i, j, k)];
                tmp2 = dty * velocY[this.IX(i, j, k)];
                tmp3 = dtz * velocZ[this.IX(i, j, k)];
                
                x = ifloat - tmp1;
                y = jfloat - tmp2;
                z = kfloat - tmp3;
                
                if(x < 0.5) x = 0.5;
                if(x > Nfloat + 0.5) x = Nfloat + 0.5;
                i0 = Math.floor(x);
                i1 = i0 + 1.0;
                
                if(y < 0.5) y = 0.5;
                if(y > Nfloat + 0.5) y = Nfloat + 0.5;
                j0 = Math.floor(y);
                j1 = j0 + 1.0;

                if(z < 0.5) z = 0.5;
                if(z > Nfloat + 0.5) z = Nfloat + 0.5;
                k0 = Math.floor(z);
                k1 = k0 + 1.0;
                
                s1 = x - i0;
                s0 = 1.0 - s1;
                t1 = y - j0;
                t0 = 1.0 - t1;
                u1 = z - k0;
                u0 = 1.0 - u1;
                
                const i0i = Math.floor(i0);
                const i1i = Math.floor(i1);
                const j0i = Math.floor(j0);
                const j1i = Math.floor(j1);
                const k0i = Math.floor(k0);
                const k1i = Math.floor(k1);

                d[this.IX(i, j, k)] =
                    s0 * (t0 * (u0 * d0[this.IX(i0i, j0i, k0i)] + u1 * d0[this.IX(i0i, j0i, k1i)]) +
                          t1 * (u0 * d0[this.IX(i0i, j1i, k0i)] + u1 * d0[this.IX(i0i, j1i, k1i)])) +
                    s1 * (t0 * (u0 * d0[this.IX(i1i, j0i, k0i)] + u1 * d0[this.IX(i1i, j0i, k1i)]) +
                          t1 * (u0 * d0[this.IX(i1i, j1i, k0i)] + u1 * d0[this.IX(i1i, j1i, k1i)]));
            }
        }
    }
    this.set_bnd(b, d);
  }

  set_bnd(b: number, x: number[]) {
    const N = this.size;
    for(let j = 1; j < N - 1; j++) {
        for(let i = 1; i < N - 1; i++) {
            x[this.IX(i, j, 0)] = b === 3 ? -x[this.IX(i, j, 1)] : x[this.IX(i, j, 1)];
            x[this.IX(i, j, N - 1)] = b === 3 ? -x[this.IX(i, j, N - 2)] : x[this.IX(i, j, N - 2)];
        }
    }
    for(let k = 1; k < N - 1; k++) {
        for(let i = 1; i < N - 1; i++) {
            x[this.IX(i, 0, k)] = b === 2 ? -x[this.IX(i, 1, k)] : x[this.IX(i, 1, k)];
            x[this.IX(i, N - 1, k)] = b === 2 ? -x[this.IX(i, N - 2, k)] : x[this.IX(i, N - 2, k)];
        }
    }
    for(let k = 1; k < N - 1; k++) {
        for(let j = 1; j < N - 1; j++) {
            x[this.IX(0, j, k)] = b === 1 ? -x[this.IX(1, j, k)] : x[this.IX(1, j, k)];
            x[this.IX(N - 1, j, k)] = b === 1 ? -x[this.IX(N - 2, j, k)] : x[this.IX(N - 2, j, k)];
        }
    }

    x[this.IX(0, 0, 0)] = 0.33 * (x[this.IX(1, 0, 0)] + x[this.IX(0, 1, 0)] + x[this.IX(0, 0, 1)]);
    x[this.IX(0, N - 1, 0)] = 0.33 * (x[this.IX(1, N - 1, 0)] + x[this.IX(0, N - 2, 0)] + x[this.IX(0, N - 1, 1)]);
    x[this.IX(0, 0, N - 1)] = 0.33 * (x[this.IX(1, 0, N - 1)] + x[this.IX(0, 1, N - 1)] + x[this.IX(0, 0, N - 2)]);
    x[this.IX(0, N - 1, N - 1)] = 0.33 * (x[this.IX(1, N - 1, N - 1)] + x[this.IX(0, N - 2, N - 1)] + x[this.IX(0, N - 1, N - 2)]);
    x[this.IX(N - 1, 0, 0)] = 0.33 * (x[this.IX(N - 2, 0, 0)] + x[this.IX(N - 1, 1, 0)] + x[this.IX(N - 1, 0, 1)]);
    x[this.IX(N - 1, N - 1, 0)] = 0.33 * (x[this.IX(N - 2, N - 1, 0)] + x[this.IX(N - 1, N - 2, 0)] + x[this.IX(N - 1, N - 1, 1)]);
    x[this.IX(N - 1, 0, N - 1)] = 0.33 * (x[this.IX(N - 2, 0, N - 1)] + x[this.IX(N - 1, 1, N - 1)] + x[this.IX(N - 1, 0, N - 2)]);
    x[this.IX(N - 1, N - 1, N - 1)] = 0.33 * (x[this.IX(N - 2, N - 1, N - 1)] + x[this.IX(N - 1, N - 2, N - 1)] + x[this.IX(N - 1, N - 1, N - 2)]);
  }
}
