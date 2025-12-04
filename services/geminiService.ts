import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { StoryResponse } from "../types";

// Define the schema for the story engine output
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "The next segment of the story. Be descriptive, immersive, and engaging. About 100-150 words.",
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The updated list of items in the player's inventory based on the story events.",
    },
    quest: {
      type: Type.STRING,
      description: "The current active quest or objective for the player.",
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 distinct choices for the player to take next.",
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A detailed visual description of the current scene for an image generator. Focus on environment, mood, and key characters. Do not include text instructions.",
    },
  },
  required: ["narrative", "inventory", "quest", "choices", "imagePrompt"],
};

export class GeminiService {
  private ai: GoogleGenAI;
  private model: any;

  constructor() {
    // API Key is injected via process.env.API_KEY
    // We create a new instance each time we might need a fresh key if re-selected,
    // but the class instance usually persists.
    // For the Veo/Pro image key requirement, we will handle re-instantiation in the App if needed,
    // but generally the process.env.API_KEY is expected to be correct after selection.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateStorySegment(
    history: { role: string; parts: { text: string }[] }[],
    userInput: string
  ): Promise<StoryResponse> {
    
    // We use gemini-3-pro-preview for complex reasoning and state tracking
    const modelId = "gemini-3-pro-preview";

    const systemInstruction = `
      You are an advanced Dungeon Master for a text-based Choose Your Own Adventure game.
      Your goal is to create an immersive, infinite story where the user's choices genuinely alter the plot.
      
      RULES:
      1. Manage the player's INVENTORY and CURRENT QUEST automatically.
      2. If the user finds an item, add it to inventory. If they use/lose it, remove it.
      3. Update the Quest based on narrative progression.
      4. Provide 3 distinct choices at the end of each turn, but acknowledge the user can type anything.
      5. Maintain a consistent tone: Epic, slightly dark fantasy, high stakes.
      6. Output JSON matching the schema provided.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: modelId,
        contents: [
          ...history,
          { role: "user", parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: storySchema,
          temperature: 0.8, // Slightly creative
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as StoryResponse;

    } catch (error) {
      console.error("Story Generation Error:", error);
      throw error;
    }
  }

  async generateSceneImage(prompt: string, size: '1K' | '2K' | '4K'): Promise<string> {
    // We use gemini-3-pro-image-preview (Nano Banana Pro) as requested
    const modelId = "gemini-3-pro-image-preview";
    
    // Enforce consistent art style
    const stylePrompt = "Art style: Digital oil painting, fantasy concept art, high detail, atmospheric lighting, cinematic composition. ";
    const fullPrompt = stylePrompt + prompt;

    try {
      const response = await this.ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: size 
          }
        }
      });

      // Nano Banana Pro returns image in parts
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data found in response");

    } catch (error) {
      console.error("Image Generation Error:", error);
      // Return a placeholder if generation fails to avoid crashing the game flow
      return `https://picsum.photos/seed/${Math.random()}/800/600`;
    }
  }
}
