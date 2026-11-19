import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Directorio de persistencia local en servidor
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.resolve(dataDir, 'atletismo_db.json');

// Endpoint de Monitoreo de Salud Oficial (/production-web Paso 12)
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Atletismo Escolar Pro API',
    memory: {
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    }
  });
});

// Lectura de Estado
app.get('/api/tournament', (req, res) => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Error leyendo base de datos local:', err);
    }
  }
  return res.json({ success: true, data: null });
});

// Guardado de Estado
app.post('/api/tournament', (req, res) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(req.body, null, 2), 'utf8');
    return res.json({ success: true, message: 'Torneo guardado en servidor.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Si existe carpeta dist construida, servirla estáticamente
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback universal para SPA
  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🏃 Servidor de Atletismo Escolar Pro activo en http://localhost:${PORT}`);
  console.log(`🩺 Health check disponible en http://localhost:${PORT}/api/health`);
});
