
import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const interpretMood = async (userInput: string): Promise<Song[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User mood: "${userInput}". Recommend 8 matching songs (mix of English and Hindi). 
      
      CRITICAL FOR EMBEDDED PLAYBACK:
      Many official music videos (VEVO, T-Series) block embedding with errors like "Video unavailable" or "Error 150/153".
      To ensure the video plays INSIDE the app, you MUST find YouTube URLs for:
      1. 'Topic' channel versions (e.g., "Artist Name - Topic")
      2. 'Official Audio' versions
      3. High-quality 'Lyrics' videos
      
      AVOID official cinematic music videos if possible as they are often restricted.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              youtubeUrl: { type: Type.STRING, description: "The YouTube URL for an embed-friendly version (Topic or Audio preferred)" },
            },
            required: ["title", "artist", "youtubeUrl"],
          },
        },
      },
    });

    const jsonStr = response.text.trim();
    const songs = JSON.parse(jsonStr) as any[];
    
    return songs.map((s, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      title: s.title,
      artist: s.artist,
      youtubeQuery: s.youtubeUrl, 
      youtubeUrl: s.youtubeUrl
    }));
  } catch (error) {
    console.error("Error interpreting mood:", error);
    return [];
  }
};

export const getSongsByMoodId = async (moodId: string): Promise<Song[]> => {
  const moodPromptMap: Record<string, string> = {
    gym: "Aggressive workout tracks (Phonk, Hip-hop, Bollywood). Find 'Audio' or 'Topic' versions.",
    chill: "Lofi and Indie relax. Use 'Topic' channel links.",
    party: "Club bangers and Bollywood dance. Find embeddable audio versions.",
    sad: "Deep emotional songs. Find 'Lyrics' or 'Audio' versions.",
    happy: "Upbeat energy. Ensure embeddable links.",
    'old-school': "Vintage classics. Usually safe via 'Topic' channels.",
    pop: "Current hits. Use 'Official Audio' to avoid VEVO blocks.",
    focus: "Instrumental study music.",
    hindi: "Latest Hindi hits. AVOID T-Series official music videos (they block embedding); find 'Audio' or 'Lyrics' instead.",
  };

  const prompt = moodPromptMap[moodId] || moodId;
  return interpretMood(prompt);
};
