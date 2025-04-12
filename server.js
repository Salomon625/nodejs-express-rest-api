import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import nspell from 'nspell';

const app = express();

// Configuración CORS (idéntica)
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));

// Variables de diccionarios (sin cambios)
let spellcheckerEs = null;
let spellcheckerDe = null;

// Función de carga (optimizada pero misma estructura)
const loadDictionaries = async () => {
  try {
    const basePath = path.join(process.cwd(), 'diccionaries');
    
    const [
      [affEs, dicEs],
      [affDe, dicDe]
    ] = await Promise.all([
      Promise.all([
        fs.readFile(path.join(basePath, 'indice.aff')),
        fs.readFile(path.join(basePath, 'indice.dic'))
      ]),
      Promise.all([
        fs.readFile(path.join(basePath, 'aleman.aff')),
        fs.readFile(path.join(basePath, 'aleman.dic'))
      ])
    ]);

    spellcheckerEs = nspell(affEs, dicEs);
    spellcheckerDe = nspell(affDe, dicDe);

    console.log('✅ Diccionarios cargados correctamente');
  } catch (err) {
    console.error('❌ Error al cargar diccionarios:', err);
    process.exit(1);
  }
};

// Middleware (idéntico)
app.use((req, res, next) => {
  if (!spellcheckerEs || !spellcheckerDe) {
    return res.status(503).json({ 
      error: "Servicio no disponible. Los diccionarios se están cargando." 
    });
  }
  next();
});

// Endpoint (misma interfaz)
app.post('/corregir', (req, res) => {
  try {
    const { texto, idioma = 'es' } = req.body;
    
    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: "El campo 'texto' es requerido y debe ser una cadena" });
    }

    const spellchecker = idioma === 'de' ? spellcheckerDe : spellcheckerEs;
    
    const textoCorregido = texto.split(/\s+/).map(palabra => {
      const palabraLimpia = palabra.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, '');
      return spellchecker.correct(palabraLimpia) 
        ? palabra 
        : (spellchecker.suggest(palabraLimpia)[0] || palabra);
    }).join(' ');

    res.json({ 
      original: texto,
      corregido: textoCorregido,
      idioma_utilizado: idioma
    });

  } catch (error) {
    console.error('Error en /corregir:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Inicialización (¡CON EL MENSAJE ORIGINAL!)
const startServer = async () => {
  await loadDictionaries();
  
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`🚀 Servidor listo en https://nodejs-express-rest-api-j5lr.onrender.com`); // Mensaje conservado
  });

  server.on('error', (error) => {
    console.error('💥 Error del servidor:', error);
    process.exit(1);
  });
};

startServer();