import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import ytdl from '@distube/ytdl-core';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get YouTube video metadata
  app.get('/api/youtube-info', async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Falta o parâmetro url' });
    }

    try {
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'URL do YouTube inválida' });
      }

      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title || 'YouTube Audio';
      const duration = parseInt(info.videoDetails.lengthSeconds || '0', 10);
      const author = info.videoDetails.author?.name || 'Unknown Artist';
      const thumbnail = info.videoDetails.thumbnails?.[0]?.url || '';

      res.json({
        title,
        artist: author,
        duration,
        coverUrl: thumbnail,
      });
    } catch (error: any) {
      console.error('Erro ao buscar metadados do YouTube:', error);
      res.status(500).json({ error: error.message || 'Falha ao buscar informações do vídeo' });
    }
  });

  // API Route: Download/stream YouTube audio
  app.get('/api/youtube-download', async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Falta o parâmetro url' });
    }

    try {
      if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'URL do YouTube inválida' });
      }

      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title || 'audio';
      const format = ytdl.chooseFormat(info.formats, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });

      if (!format || !format.url) {
        return res.status(404).json({ error: 'Nenhum formato de áudio encontrado para este vídeo' });
      }

      // Safe filename header
      const safeFilename = encodeURIComponent(title.replace(/[^a-zA-Z0-9 ]/g, ''));
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      // Create stream and pipe to response
      const stream = ytdl(videoUrl, {
        format: format,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        }
      });

      stream.on('error', (err) => {
        console.error('Erro na stream do ytdl:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro durante o streaming do áudio' });
        }
      });

      stream.pipe(res);
    } catch (error: any) {
      console.error('Erro no download do YouTube:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Falha ao baixar áudio do YouTube' });
      }
    }
  });

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
