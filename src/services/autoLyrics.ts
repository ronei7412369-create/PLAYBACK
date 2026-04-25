import { GoogleGenAI } from "@google/genai";

export async function generateLyricsAndChords(title: string, artist: string = ""): Promise<string> {
  const query = `Please provide the lyrics with chords for the song "${title}" ${artist ? `by ${artist}` : ''}. Format the output in Markdown. Use the format \`[C] [G]\` for chords placed accurately above the lyrics. Provide ONLY the markdown text, no surrounding explanations or filler text. Start directly with the first verse or section header like "## Verse 1".`;
  
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
