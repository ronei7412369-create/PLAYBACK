import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import ytdl from '@distube/ytdl-core';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: AI Tempo & Meter Detection for Splitter Songs
  app.post('/api/ai-tempo-detect', async (req, res) => {
    const { title, artist, dspBpm, dspOffset, duration } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        bpm: dspBpm || 120,
        timeSignature: '4/4',
        firstBeatOffset: dspOffset || 0,
        source: 'dsp_fallback'
      });
    }

    try {
      const prompt = `You are a music production AI expert in tempo and meter analysis.
Analyze the musical track metadata:
- Title: "${title || 'Unknown'}"
- Artist: "${artist || 'Unknown'}"
- Audio Duration: ${duration || 0} seconds
- DSP Onset Estimate: ~${dspBpm || 120} BPM

Decipher and return the exact standard studio BPM (tempo) and standard Time Signature (fórmula de compasso, e.g., '4/4', '6/8', '3/4', '12/8', '2/4', '5/4') for this specific song.
Return ONLY a valid JSON object matching this schema:
{
  "bpm": <number integer between 40 and 260>,
  "timeSignature": "<string standard time signature like '4/4', '6/8', etc.>",
  "confidence": <number between 0 and 1>
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const jsonText = response.text || '';
      const parsed = JSON.parse(jsonText);

      const bpm = typeof parsed.bpm === 'number' && parsed.bpm >= 30 && parsed.bpm <= 300 
        ? Math.round(parsed.bpm) 
        : (dspBpm || 120);

      const timeSignature = typeof parsed.timeSignature === 'string' && parsed.timeSignature.includes('/') 
        ? parsed.timeSignature.trim() 
        : '4/4';

      return res.json({
        bpm,
        timeSignature,
        firstBeatOffset: dspOffset || 0,
        source: 'gemini_ai'
      });
    } catch (error: any) {
      console.error('Gemini AI Tempo Detection Error:', error);
      return res.json({
        bpm: dspBpm || 120,
        timeSignature: '4/4',
        firstBeatOffset: dspOffset || 0,
        source: 'dsp_fallback_error'
      });
    }
  });

  // API Route: Get YouTube video metadata
  app.get('/api/youtube-info', async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Falta o parâmetro url' });
    }

    try {
      // Extract video ID if possible
      const idMatch = videoUrl.match(/(?:v=|\/embed\/|\/v\/|https:\/\/youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
      const videoId = idMatch ? idMatch[1] : null;

      // Try ytdl first
      if (ytdl.validateURL(videoUrl)) {
        try {
          const info = await ytdl.getInfo(videoUrl);
          const title = info.videoDetails.title || 'YouTube Audio';
          const duration = parseInt(info.videoDetails.lengthSeconds || '0', 10);
          const author = info.videoDetails.author?.name || 'Unknown Artist';
          const thumbnail = info.videoDetails.thumbnails?.[0]?.url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

          return res.json({
            title,
            artist: author,
            duration,
            coverUrl: thumbnail,
          });
        } catch (ytdlErr: any) {
          console.warn('ytdl.getInfo falhou, tentando fallback oEmbed/Invidious:', ytdlErr.message);
        }
      }

      // Fallback: YouTube oEmbed
      if (videoId) {
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (oembedRes.ok) {
            const odata = await oembedRes.json();
            return res.json({
              title: odata.title || 'YouTube Audio',
              artist: odata.author_name || 'Artista do YouTube',
              duration: 210,
              coverUrl: odata.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            });
          }
        } catch (oembedErr) {
          console.warn('oEmbed fallback falhou:', oembedErr);
        }
      }

      return res.status(400).json({ error: 'URL do YouTube inválida ou vídeo indisponível' });
    } catch (error: any) {
      console.error('Erro ao buscar metadados do YouTube:', error);
      res.status(500).json({ error: 'Falha ao buscar informações do vídeo no YouTube' });
    }
  });

  // API Route: Download/stream YouTube audio
  app.get('/api/youtube-download', async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Falta o parâmetro url' });
    }

    const idMatch = videoUrl.match(/(?:v=|\/embed\/|\/v\/|https:\/\/youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = idMatch ? idMatch[1] : null;

    // Helper to pipe remote audio stream to response
    const pipeAudioUrl = async (audioStreamUrl: string, title: string = 'audio') => {
      const audioRes = await fetch(audioStreamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      if (!audioRes.ok || !audioRes.body) {
        throw new Error(`Falha ao obter stream remota: ${audioRes.statusText}`);
      }

      const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9 ]/g, ''));
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      // @ts-ignore
      const reader = audioRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };

    // Attempt 1: ytdl stream
    if (ytdl.validateURL(videoUrl)) {
      try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title || 'audio';
        const format = ytdl.chooseFormat(info.formats, {
          filter: 'audioonly',
          quality: 'highestaudio',
        });

        if (format && format.url) {
          const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9 ]/g, ''));
          res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.mp3"`);
          res.setHeader('Content-Type', 'audio/mpeg');

          const stream = ytdl(videoUrl, {
            format: format,
            requestOptions: {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              }
            }
          });

          let streamErrored = false;
          stream.on('error', async (err) => {
            console.warn('Erro na stream ytdl, tentando fallback Cobalt/Piped:', err.message);
            streamErrored = true;
            if (!res.headersSent && videoId) {
              try {
                await tryFallbackStream(videoUrl, videoId, res, pipeAudioUrl);
              } catch (fallbackErr: any) {
                if (!res.headersSent) {
                  res.status(500).json({ error: 'Erro de rede no servidor do YouTube. Faça o upload direto de um arquivo MP3.' });
                }
              }
            }
          });

          if (!streamErrored) {
            stream.pipe(res);
            return;
          }
        }
      } catch (ytdlErr: any) {
        console.warn('ytdl download falhou:', ytdlErr.message);
      }
    }

    // Attempt 2: Fallback streaming via Cobalt / Invidious / Piped
    if (videoId) {
      try {
        await tryFallbackStream(videoUrl, videoId, res, pipeAudioUrl);
        return;
      } catch (fallbackErr: any) {
        console.error('Todos os métodos de download do YouTube falharam:', fallbackErr);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({ error: 'Não foi possível baixar este áudio do YouTube. O YouTube pode estar bloqueando temporariamente requisições de servidores. Por favor, envie o arquivo de áudio diretamente do seu computador.' });
    }
  });

  async function tryFallbackStream(videoUrl: string, videoId: string, res: express.Response, pipeAudioUrl: Function) {
    // Cobalt API
    try {
      const cobaltRes = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
        })
      });

      if (cobaltRes.ok) {
        const cdata = await cobaltRes.json();
        if (cdata.url) {
          await pipeAudioUrl(cdata.url, 'youtube_audio');
          return;
        }
      }
    } catch (cErr) {
      console.warn('Cobalt fallback error:', cErr);
    }

    // Piped API
    try {
      const pipedRes = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
      if (pipedRes.ok) {
        const pdata = await pipedRes.json();
        const audioStreams = pdata.audioStreams || [];
        if (audioStreams.length > 0 && audioStreams[0].url) {
          await pipeAudioUrl(audioStreams[0].url, pdata.title || 'youtube_audio');
          return;
        }
      }
    } catch (pErr) {
      console.warn('Piped fallback error:', pErr);
    }

    throw new Error('Fallback streams failed');
  }

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
