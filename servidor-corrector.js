import express from 'express';
import cors from 'cors';
import nspell from 'nspell';
import dictionaryEs from 'dictionary-es';

const app = express();
app.use(cors());
app.use(express.json());

const loadDictionary = async () => {
  const dictEs = await dictionaryEs;
  return nspell(dictEs);
};

let spellchecker;

loadDictionary().then((dict) => {
  spellchecker = dict;
  console.log("Diccionario de español cargado correctamente.");
}).catch((error) => {
  console.error("Error al cargar el diccionario:", error);
});

app.post('/corregir', (req, res) => {
  const texto = req.body.texto;
  console.log("Mensaje recibido:", texto);

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
  console.log("Mensaje corregido:", textoCorregido);
  
  res.json({ corregido: textoCorregido });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
