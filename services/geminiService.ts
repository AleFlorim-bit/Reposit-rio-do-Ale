import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, AIBossProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBossProfile = async (stats: PlayerStats): Promise<AIBossProfile> => {
  const avgDistance = stats.distanceKept / (stats.framesRecorded || 1);
  const aggressionRatio = stats.aggressionTime / (stats.framesRecorded || 1);
  const jumpRatio = stats.jumps / (stats.framesRecorded / 60 || 1); // Jumps per second approx
  const meleeFreq = stats.meleeAttacks / (stats.framesRecorded / 60 || 1);
  const shotFreq = stats.shotsFired / (stats.framesRecorded / 60 || 1);

  const prompt = `
    Analyze these player gameplay statistics from a Fantasy Action RPG prototype:
    - Average Distance kept: ${avgDistance.toFixed(2)} units (Close < 150, Far > 300)
    - Aggression Ratio: ${(aggressionRatio * 100).toFixed(1)}% (Time spent moving towards enemy)
    - Jump Frequency: ${jumpRatio.toFixed(2)} jumps/sec
    - Melee Frequency: ${meleeFreq.toFixed(2)} hits/sec
    - Shooting Frequency: ${shotFreq.toFixed(2)} spells/sec
    - Air Time: ${stats.airTime} frames
    
    Create a "Mirror Shadow" (Boss) designed specifically to PUNISH this playstyle.
    The theme is Dark Fantasy/Anime. The boss is a corrupted reflection of the hero.
    
    LANGUAGE INSTRUCTION: 
    All text fields (name, title, description, dialogues, strategy_analysis) MUST BE IN PORTUGUESE (PT-BR).
    Use fantasy terminology: "Mana", "Soul", "Void", "Blade", "Abyss", "Light".
    
    TACTICAL RULES:
    1. VS RANGED MAGES (High Shot Freq/Distance): Boss is a 'Void Stalker' (Rushdown/Dash Heavy) to cut distance.
    2. VS AERIAL ACROBATS (High Air Time): Boss is a 'Gravity Warden' (Grounded/Heavy) waiting to punish landings.
    3. VS BERSERKERS (High Aggression): Boss is a 'Phantom Duelist' (Evasive/Counter) to punish reckless attacks.
    4. VS PASSIVE PLAYERS: Boss is a 'Chaos Marauder' (Relentless Aggression).

    Return JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            archetype: { type: Type.STRING, enum: ['Shadow', 'Tank', 'Sniper', 'Berserker', 'Counter'] },
            description: { type: Type.STRING },
            dialogue_intro: { type: Type.STRING },
            dialogue_win: { type: Type.STRING },
            dialogue_lose: { type: Type.STRING },
            strategy_analysis: { type: Type.STRING, description: "Mystical explanation of the player's soul weakness." },
            tactics: {
              type: Type.OBJECT,
              properties: {
                preferredDistance: { type: Type.STRING, enum: ['CLOSE', 'MID', 'FAR'] },
                movementStyle: { type: Type.STRING, enum: ['GROUNDED', 'AERIAL', 'DASH_HEAVY'] },
                aggressionLevel: { type: Type.STRING, enum: ['DEFENSIVE', 'BALANCED', 'RUSH_DOWN'] }
              },
              required: ['preferredDistance', 'movementStyle', 'aggressionLevel']
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                speedMultiplier: { type: Type.NUMBER },
                jumpFrequency: { type: Type.NUMBER },
                reactionTime: { type: Type.NUMBER },
                damageMultiplier: { type: Type.NUMBER },
                projectileRate: { type: Type.NUMBER },
                colorHex: { type: Type.STRING }
              },
              required: ['speedMultiplier', 'jumpFrequency', 'reactionTime', 'damageMultiplier', 'projectileRate', 'colorHex']
            }
          },
          required: ['name', 'title', 'archetype', 'description', 'dialogue_intro', 'strategy_analysis', 'tactics', 'stats']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIBossProfile;

  } catch (error) {
    console.error("Failed to generate boss profile:", error);
    // Fallback profile translated
    return {
      name: "Sombra Estilhaçada",
      title: "O Reflexo Padrão",
      archetype: "Counter",
      description: "Uma manifestação do Vazio, surgindo quando a conexão espiritual falha. Ele imita movimentos básicos sem alma.",
      dialogue_intro: "Eu sou aquilo que você teme se tornar...",
      dialogue_win: "Sua luz se apaga.",
      dialogue_lose: "O espelho... se quebra...",
      strategy_analysis: "A alma do herói parece equilibrada, então a Sombra adotará uma postura de espelhamento direto.",
      tactics: {
        preferredDistance: 'MID',
        movementStyle: 'GROUNDED',
        aggressionLevel: 'BALANCED'
      },
      stats: {
        speedMultiplier: 1.1,
        jumpFrequency: 0.5,
        reactionTime: 15,
        damageMultiplier: 1,
        projectileRate: 0.3,
        colorHex: "#9333ea" // Purple
      }
    };
  }
};