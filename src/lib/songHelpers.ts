/**
 * Smart helper to detect Key and BPM from song metadata, title, file names, or stem files.
 */
export function detectKeyAndBpm(text: string, siblingTexts: string[] = []): { key: string; bpm: number } {
  const allTexts = [text, ...siblingTexts].map(t => t.toLowerCase());

  // 1. Detect BPM
  let detectedBpm = 120; // Default fallback
  const bpmPatterns = [
    /\b(\d{2,3})\s*bpm\b/i,
    /\bbpm\s*[:=-]?\s*(\d{2,3})\b/i,
    /\b(?:tom|key)\s*.*\s+(\d{2,3})\b/i,
    /[\s_\-()\[\]](\d{2,3})[\s_\-()\[\]]/, // Isolated numbers like "- 120 -" or "[120]"
  ];

  for (const t of allTexts) {
    let matched = false;
    for (const pattern of bpmPatterns) {
      const match = t.match(pattern);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 40 && val <= 250) {
          detectedBpm = val;
          matched = true;
          break;
        }
      }
    }
    if (matched) break;
  }

  // 2. Detect Key (Tom)
  let detectedKey = 'C'; // Default fallback

  // Specific keys (with accidentals/minor) are highly reliable
  const specificKeyRegex = /\b(c#m|dbm|d#m|ebm|f#m|gbm|g#m|abm|a#m|bbm|cm|dm|em|fm|gm|am|bm|c#|db|d#|eb|f#|gb|g#|ab|a#|bb)\b/i;
  // Natural major keys (C, D, E, F, G, A, B) are matched only when isolated or prefixed
  const naturalKeyRegex = /(?:^|[\s_\-()\[\]])([cdefgab])(?:[\s_\-()\[\]]|$)/i;
  const keyPrefixedRegex = /\b(?:tom|key|keyof)\s*[:=-]?\s*([a-g][#b]?m?)\b/i;

  for (const t of allTexts) {
    // Check prefixed key first (e.g. "tom: G" or "key: F#m")
    const prefMatch = t.match(keyPrefixedRegex);
    if (prefMatch) {
      detectedKey = formatKeyStr(prefMatch[1]);
      break;
    }

    // Check specific keys
    const specMatch = t.match(specificKeyRegex);
    if (specMatch) {
      detectedKey = formatKeyStr(specMatch[1]);
      break;
    }

    // Check isolated natural keys
    const natMatch = t.match(naturalKeyRegex);
    if (natMatch) {
      const possibleKey = natMatch[1].toUpperCase();
      // Avoid matching common Portuguese pronouns or words like 'e', 'a' as natural keys
      if (possibleKey !== 'E' && possibleKey !== 'A') {
        detectedKey = possibleKey;
        break;
      }
    }
  }

  return { key: detectedKey, bpm: detectedBpm };
}

function formatKeyStr(rawKey: string): string {
  let key = rawKey.trim().toUpperCase();
  
  // Normalize minor notations like 'MIN' or 'MINOR' or lowercase 'm'
  if (key.endsWith('MIN')) {
    key = key.replace('MIN', 'm');
  } else if (key.endsWith('MINOR')) {
    key = key.replace('MINOR', 'm');
  } else if (rawKey.endsWith('m')) {
    // If original ended in lowercase 'm', convert back to 'm'
    key = key.substring(0, key.length - 1) + 'm';
  }
  
  // Normalize accidentals (C#M -> C#m, etc.)
  if (key.endsWith('M') && key.length > 1 && !key.endsWith('BM')) {
    // Check if it's DbM, C#M, etc. - in music theory 'M' usually stands for Major, but in text files 'm' or 'M' can be minor depending on notation.
    // Let's assume lowercase 'm' is minor. If the original text had lowercase 'm', we set it.
    if (rawKey.endsWith('m')) {
      key = key.substring(0, key.length - 1) + 'm';
    } else if (rawKey.endsWith('M')) {
      // If uppercase M was explicitly used, it's usually Major, so we just remove the 'M'
      key = key.substring(0, key.length - 1);
    }
  }

  // Ensure Db, Eb, Gb, Ab, Bb notation uses lowercase 'b' for flat
  if (key.endsWith('B') && key.length > 1 && key !== 'BB') {
    key = key.substring(0, key.length - 1) + 'b';
  } else if (key.includes('B') && !key.startsWith('B') && !key.endsWith('m')) {
    key = key.replace('B', 'b');
  } else if (key.includes('B') && !key.startsWith('B') && key.endsWith('m')) {
    key = key.replace('B', 'b');
  }

  return key;
}
