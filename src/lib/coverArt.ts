/**
 * Utility to generate or retrieve beautiful cover and banner arts for songs
 * based on their title, artist or content keywords.
 */

const WORSHIP_COVERS = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80", // Concert yellow/blue lights
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80", // Crowd glowing lights
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80", // Lights and silhouette hands
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80"  // Stage glowing rays
];

const GUITAR_COVERS = [
  "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80", // Electric guitar neon blue
  "https://images.unsplash.com/photo-1487180142328-054b783fc471?auto=format&fit=crop&w=600&q=80", // Vintage headstock
  "https://images.unsplash.com/photo-1525201548942-d8c8bc0ddae7?auto=format&fit=crop&w=600&q=80", // Guitar spotlight
  "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80"  // Amplifier glowing tube
];

const PIANO_COVERS = [
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80", // Piano keys dark
  "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=600&q=80", // Synthesizer knobs
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80"  // Fender Rhodes keys
];

const VOCAL_COVERS = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80", // Vintage condenser mic
  "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=600&q=80", // Stage microphone close up
  "https://images.unsplash.com/photo-1484755560693-a4074577af3a?auto=format&fit=crop&w=600&q=80"  // Recording vocals
];

const GENERAL_COVERS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80", // Concert lasers
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80", // DJ controller / rave lights
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80", // Stage gold lights
  "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=600&q=80", // Spinning vinyl warm
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80"  // Abstract audio waveforms / lights
];

/**
 * Deterministic helper to get a index from a string hash
 */
function getHashIndex(str: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % length;
}

/**
 * Returns a gorgeous Unsplash cover URL tailored to the song metadata.
 * It is completely deterministic so a song will always get the same cover art.
 */
export function getCoverUrl(title: string = "", artist: string = ""): string {
  const combined = `${title.trim()} ${artist.trim()}`.toLowerCase();

  // 1. Worship / Gospel stage
  if (
    combined.includes("adorar") || 
    combined.includes("adoracao") || 
    combined.includes("adoração") || 
    combined.includes("senhor") || 
    combined.includes("deus") || 
    combined.includes("jesus") || 
    combined.includes("gloria") || 
    combined.includes("glória") || 
    combined.includes("worship") || 
    combined.includes("praise") || 
    combined.includes("louvor") || 
    combined.includes("igreja") || 
    combined.includes("culto") ||
    combined.includes("gospel") ||
    combined.includes("reino") ||
    combined.includes("pai")
  ) {
    const idx = getHashIndex(title + artist, WORSHIP_COVERS.length);
    return WORSHIP_COVERS[idx];
  }

  // 2. Guitar / String / Rock
  if (
    combined.includes("acoustic") || 
    combined.includes("acustico") || 
    combined.includes("acústico") || 
    combined.includes("violao") || 
    combined.includes("violão") || 
    combined.includes("guitar") || 
    combined.includes("guitarra") || 
    combined.includes("solo") || 
    combined.includes("rock") || 
    combined.includes("metal") || 
    combined.includes("band") ||
    combined.includes("riff")
  ) {
    const idx = getHashIndex(title + artist, GUITAR_COVERS.length);
    return GUITAR_COVERS[idx];
  }

  // 3. Piano / Synth
  if (
    combined.includes("teclado") || 
    combined.includes("piano") || 
    combined.includes("synth") || 
    combined.includes("pads") || 
    combined.includes("keys") || 
    combined.includes("keyboard") || 
    combined.includes("organ") ||
    combined.includes("órgão")
  ) {
    const idx = getHashIndex(title + artist, PIANO_COVERS.length);
    return PIANO_COVERS[idx];
  }

  // 4. Vocals / Mic
  if (
    combined.includes("vocal") || 
    combined.includes("vocals") || 
    combined.includes("voz") || 
    combined.includes("sing") || 
    combined.includes("cantor") || 
    combined.includes("cantora") || 
    combined.includes("mic") || 
    combined.includes("microfone") ||
    combined.includes("chorus") ||
    combined.includes("coral")
  ) {
    const idx = getHashIndex(title + artist, VOCAL_COVERS.length);
    return VOCAL_COVERS[idx];
  }

  // 5. Default General / Epic Concert covers
  const idx = getHashIndex(title + artist, GENERAL_COVERS.length);
  return GENERAL_COVERS[idx];
}
