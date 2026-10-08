require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const photographersRoutes = require('./routes/photographersRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const { connectMongo, isMongoConfigured } = require('./lib/mongodb');

const app = express();
const PORT = process.env.PORT || 3500;
const PUBLIC_DIR = path.join(__dirname, 'public');

let indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
indexHtml = indexHtml
  .replace('__SUPABASE_URL__', process.env.SUPABASE_URL || '')
  .replace('__SUPABASE_ANON_KEY__', process.env.SUPABASE_ANON_KEY || '')
  .replace('__MONGODB_ENABLED__', String(isMongoConfigured()));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/photographers', photographersRoutes);
app.use('/api/bookings', bookingsRoutes);

// 404 JSON para rutas /api no reconocidas
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.use(express.static(PUBLIC_DIR, { index: false }));

app.use((req, res) => {
  res.send(indexHtml);
});

app.use((error, req, res, next) => {
  console.error('[LuxArs] Error procesando la solicitud:', error);
  if (res.headersSent) return next(error);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
  return res.status(500).send('Error interno del servidor.');
});

async function start() {
  await connectMongo();
  if (isMongoConfigured()) console.log('MongoDB conectado.');

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT);
    server.once('error', reject);
    server.once('listening', () => {
      console.log('LuxArs corriendo en http://localhost:' + PORT);
      resolve(server);
    });
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error('[LuxArs] No se pudo iniciar el servidor:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
