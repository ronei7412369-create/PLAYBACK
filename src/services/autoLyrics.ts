import { GoogleGenAI } from "@google/genai";

export async function generateLyricsAndChords(title: string, artist: string = ""): Promise<string> {
  const query = `Por favor, forneça a letra com as cifras para a música "${title}" ${artist ? `por ${artist}` : ''}. IMPORTANTE: Retorne a letra totalmente traduzida para o PORTUGUÊS (PT-BR), caso a música não seja brasileira. Adapte as cifras sobre a letra traduzida o melhor possível. Formate a saída em Markdown. Use o formato \`[C] [G]\` para as cifras colocadas precisamente acima da letra. Forneça APENAS o texto em markdown, sem explicações ou textos adicionais. Comece diretamente com o primeiro verso ou cabeçalho da seção como "## Verso 1" ou "## Intro".`;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
    });
    return response.text || "";
  } catch (err) {
    console.error("Error generating lyrics:", err);
    throw err;
  }
}
