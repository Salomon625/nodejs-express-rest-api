import express from 'express';
import cors from 'cors';
import { franc } from 'franc-min';
import nspell from 'nspell';
import dictionaryEs from 'dictionary-es';
import dictionaryEn from 'dictionary-en';

const app = express();

// Permitir solicitudes de otros orígenes
app.use(cors());

// Para parsear JSON en las solicitudes
app.use(express.json());

// Función para cargar los diccionarios
const loadDictionaries = async () => {
  const dictEs = await dictionaryEs;
  const dictEn = await dictionaryEn;
  return {
    spanish: nspell(dictEs),
    english: nspell(dictEn),
  };
};

// Función para detectar el idioma
const detectLanguage = (text, dictionaries) => {
  console.log("Texto recibido:", text); // Mostrar lo que recibe el servidor

  const francResult = franc(text);
  let language = 'desconocido';

  if (francResult === 'spa') {
    language = 'español';
  } else if (francResult === 'eng') {
    language = 'inglés';
  }

  // Si el idioma detectado no es claro, comprobar con los diccionarios
  if (language === 'desconocido') {
    if (dictionaries.spanish.correct(text)) {
      language = 'español';
    } else if (dictionaries.english.correct(text)) {
      language = 'inglés';
    }
  }

  console.log("Idioma detectado:", language); // Mostrar lo que envía el servidor
  return language;
};

// Ruta para corregir el texto y detectar idioma
app.post('/corregir', async (req, res) => {
  const texto = req.body.texto;

  try {
    const dictionaries = await loadDictionaries();
    const language = detectLanguage(texto, dictionaries);
    res.json({ idioma: language });
  } catch (error) {
    console.error('Error al detectar el idioma:', error);
    res.status(500).send('Error al detectar el idioma.');
  }
});

// Configuración del servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
