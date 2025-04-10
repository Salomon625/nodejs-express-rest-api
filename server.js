import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import nspell from 'nspell';

const app = express();

// Configuración mejorada de CORS
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' })); // Limitar tamaño del payload

// Variables para los correctores
let spellcheckerEs = null;
let spellcheckerDe = null;

// Función mejorada para cargar diccionarios
const loadDictionaries = async () => {
  try {
    const basePath = path.join(process.cwd(), 'diccionaries');
    
    // Cargar diccionarios en paralelo
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
    return true;
  } catch (err) {
    console.error('❌ Error crítico al cargar diccionarios:', err);
    process.exit(1); // Salir si no se cargan los diccionarios
  }
};

// Middleware para verificar diccionarios
app.use((req, res, next) => {
  if (!spellcheckerEs || !spellcheckerDe) {
    return res.status(503).json({ 
      error: "Servicio no disponible. Los diccionarios se están cargando." 
    });
  }
  next();
});

// Endpoint mejorado de corrección
app.post('/corregir', (req, res) => {
  try {
    const { texto, idioma = 'es' } = req.body; // Valor por defecto 'es'
    
    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: "El campo 'texto' es requerido y debe ser una cadena" });
    }

    console.log(`📩 Corrección solicitada | Idioma: ${idioma} | Texto: ${texto.slice(0, 50)}...`);

    const spellchecker = idioma === 'de' ? spellcheckerDe : spellcheckerEs;
    
    const palabras = texto.split(/\s+/); // Maneja múltiples espacios
    const corregidas = palabras.map(palabra => {
      if (spellchecker.correct(palabra)) {
        return palabra;
      }
      const [sugerencia] = spellchecker.suggest(palabra) || [palabra];
      return sugerencia;
    });

    const textoCorregido = corregidas.join(' ');
    res.json({ 
      original: texto,
      corregido: textoCorregido,
      idioma_utilizado: idioma
    });

  } catch (error) {
    console.error('🔥 Error en el endpoint /corregir:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    diccionarios: {
      español: !!spellcheckerEs,
      alemán: !!spellcheckerDe
    }
  });
});

// Inicialización del servidor
const startServer = async () => {
  await loadDictionaries();
  
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`🚀 Servidor listo en https://nodejs-express-rest-api-j5lr.onrender.com`);
  });

  // Manejo de errores del servidor
  server.on('error', (error) => {
    console.error('💥 Error del servidor:', error);
    process.exit(1);
  });
};

startServer();