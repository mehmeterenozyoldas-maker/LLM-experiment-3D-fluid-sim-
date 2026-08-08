import { GoogleGenAI } from "@google/genai";
import { FluidConfig, FluidMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFluidExplanation = async (
  query: string, 
  currentConfig: FluidConfig,
  metrics?: FluidMetrics
): Promise<string> => {
  try {
    const configContext = `
      Current Simulation Parameters & Live Metrics:
      - Viscosity (nu): ${currentConfig.viscosity}
      - Diffusion (D): ${currentConfig.diffusion}
      - Time Step (dt): ${currentConfig.dt}
      - Vorticity Confinement Strength (eps): ${currentConfig.vorticityStrength}
      - Active View Mode: ${currentConfig.viewMode}
      - Color Spectrum: ${currentConfig.colorPalette}
      - Reynolds Number (Re): ${metrics ? metrics.reynoldsNumber.toFixed(2) : 'N/A'}
      - Kinetic Energy (Ek): ${metrics ? metrics.kineticEnergy.toFixed(2) : 'N/A'}
      - Peak Vorticity (|w|_max): ${metrics ? metrics.maxVorticity.toFixed(2) : 'N/A'}
      - Active Force Emitters: ${currentConfig.forceObjects.map(f => `${f.type} (str=${f.strength})`).join(', ') || 'None'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a distinguished Professor of Computational Fluid Dynamics (CFD) and Astrophysical Hydrodynamics.
        The system is a real-time 3D Navier-Stokes solver operating on a 32^3 grid with Jos Stam's Stable Fluids algorithm,
        augmented with vorticity confinement, pressure Poisson solvers, and trilinear advected stardust particle tracer swarms.

        ${configContext}

        User Prompt / Research Query: "${query}"

        Provide a PhD-level, scientifically rigorous yet engaging explanation. 
        Focus on physical concepts such as vortex stretching, energy cascades, turbulent dissipation, Reynolds number regimes, or astrophysical accretion dynamics.
        Include mathematical insights or LaTeX formulas when applicable. Keep it concise (3-4 paragraphs max).
      `,
    });

    return response.text || "Unable to synthesize hydrodynamics report at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the Gemini AI Physics Engine. Please verify your API Key configuration.";
  }
};

export const aiOptimizeSimulation = async (
  naturalLanguageRequest: string,
  currentConfig: FluidConfig
): Promise<{ text: string; configChanges?: Partial<FluidConfig> }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an AI Physics Director. The user wants to adjust a 3D Fluid Dynamics & Nebula simulation using natural language:
        User Request: "${naturalLanguageRequest}"

        Current Config: ${JSON.stringify(currentConfig)}

        Analyze the request and return a JSON response strictly matching this structure:
        {
          "explanation": "Brief physics explanation of the requested changes",
          "config": {
            "viscosity": number between 0.0 and 0.0001,
            "diffusion": number between 0.0 and 0.0001,
            "dt": number between 0.05 and 0.3,
            "vorticityStrength": number between 0.0 and 1.5,
            "particleCount": number between 500 and 3000,
            "colorPalette": one of ["NEBULA", "SUPERNOVA", "AURORA", "ACCRETION_DISK", "QUANTUM_PLASMA"],
            "viewMode": one of ["DENSITY", "VELOCITY", "VORTICITY", "PRESSURE", "STARDUST", "HYBRID"]
          }
        }
        Respond with ONLY raw JSON, no markdown formatting ticks.
      `,
    });

    const rawText = response.text || "";
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      text: parsed.explanation || "Simulation parameters updated according to physical specifications.",
      configChanges: parsed.config
    };
  } catch (error) {
    console.error("AI Fluid Optimization Error:", error);
    return {
      text: "Unable to parse natural language physics request. Proceeding with standard Gemini commentary.",
    };
  }
};
