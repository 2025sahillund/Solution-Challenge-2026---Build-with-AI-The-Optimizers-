import { Hospital } from "../types";

export const EMERGENCY_RESOURCES = {
  hospitals: [
    { id: "h1", name: "CityCare Hospital", bedsAvailable: 5, specialty: "Trauma & Emergency", distance: 2.5 },
    { id: "h2", name: "MetroHealth Center", bedsAvailable: 0, specialty: "Cardiology", distance: 1.2 },
    { id: "h3", name: "GeneralClinic", bedsAvailable: 12, specialty: "General Medicine", distance: 4.8 }
  ],
  fireStations: [
    { id: "f1", name: "Station 42 - Downtown", units: 3, distance: 1.5 },
    { id: "f2", name: "Station 09 - North Shore", units: 1, distance: 5.2 }
  ],
  policePrecincts: [
    { id: "p1", name: "1st Precinct", units: 8, distance: 0.8 },
    { id: "p2", name: "Central Security Hub", units: 4, distance: 2.1 }
  ]
};

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function matchHospital(emergencyType: string, guestLat?: number, guestLng?: number) {
  const prompt = `
    Find the best response strategy and hospital/station for this emergency.
    Emergency Type: ${emergencyType}
    Guest Location: ${guestLat && guestLng ? `${guestLat}, ${guestLng}` : "Unknown"}
    
    Available Resources:
    ${JSON.stringify(EMERGENCY_RESOURCES, null, 2)}
    
    Criteria:
    1. For Medical: Match a hospital with specialty and beds.
    2. For Fire: Match the closest fire station.
    3. For Security: Match the closest police precinct.
    4. Provide a 1-sentence reasoning/strategy for the response teams.
    
    Return the response as JSON with matchingResourceId and reasoning keys.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchingResourceId: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["matchingResourceId", "reasoning"]
        }
      }
    });

    const data = JSON.parse(response.text);
    
    let fallbackResource = "General Support";
    if (emergencyType === 'Medical') fallbackResource = EMERGENCY_RESOURCES.hospitals.find(h => h.bedsAvailable > 0)?.name || "General Clinic";
    if (emergencyType === 'Fire') fallbackResource = EMERGENCY_RESOURCES.fireStations[0].name;
    if (emergencyType === 'Security') fallbackResource = EMERGENCY_RESOURCES.policePrecincts[0].name;

    return {
      hospitalId: data.matchingResourceId || fallbackResource,
      reasoning: data.reasoning || "Standard emergency response protocol initiated."
    };
  } catch (error) {
    console.log("AI Match fallback used", error);
    return {
      hospitalId: "Emergency Response Hub",
      reasoning: "Protocol 42-Enhanced: Deploying closest available units based on situation assessment."
    };
  }
}
