import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import nspell from 'nspell';

const app = express();
app.use(cors());
app.use(express.json());

let spellcheckerEs;
let spellcheckerDe;

const loadDictionaries = async () => {
  try {
    // Diccionario Español
    const [affEs, dicEs] = await Promise.all([
      fs.readFile(path.join('diccionaries', 'indice.aff')),
      fs.readFile(path.join('diccionaries', 'indice.dic')),
    ]);
    spellcheckerEs = nspell(affEs, dicEs);

    // Diccionario Alemán
    const [affDe, dicDe] = await Promise.all([
      fs.readFile(path.join('diccionaries', 'aleman.aff')),
      fs.readFile(path.join('diccionaries', 'aleman.dic')),
    ]);
    spellcheckerDe = nspell(affDe, dicDe);

    console.log('✅ Diccionarios cargados correctamente.');
  } catch (err) {
    console.error('❌ Error al cargar los diccionarios:', err);
  }
};

loadDictionaries();

app.post('/corregir', (req, res) => {
  const { texto, idioma } = req.body;
  console.log("📩 Mensaje recibido:", texto, "🌐 Idioma:", idioma);

  let spellchecker;
  if (idioma === 'de') {
    spellchecker = spellcheckerDe;
  } else {
    spellchecker = spellcheckerEs;
  }

  if (!spellchecker) {
    return res.status(500).json({ error: "El diccionario no está listo." });
  }

  const palabras = texto.split(' ');
  const corregidas = palabras.map(palabra => {
    if (spellchecker.correct(palabra)) {
      return palabra;
    } else {
      const sugerencias = spellchecker.suggest(palabra);
      return sugerencias.length > 0 ? sugerencias[0] : palabra;
    }
  });

  const textoCorregido = corregidas.join(' ');
  res.json({ corregido: textoCorregido });
});

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
