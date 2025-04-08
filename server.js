import express from 'express';
import cors from 'cors';
import nspell from 'nspell';
import dictionaryEs from 'dictionary-es';
import dictionaryDe from 'dictionary-de';

const app = express();
app.use(cors());
app.use(express.json());

let spellcheckerEs;
let spellcheckerDe;

const loadDictionaries = async () => {
  const es = await dictionaryEs;
  const de = await dictionaryDe;
  spellcheckerEs = nspell(es);
  spellcheckerDe = nspell(de);
  console.log("Diccionarios cargados correctamente.");
};

loadDictionaries().catch(err => {
  console.error("Error al cargar los diccionarios:", err);
});

app.post('/corregir', (req, res) => {
  const { texto, idioma } = req.body;
  console.log("Mensaje recibido:", texto, "Idioma:", idioma);

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
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
