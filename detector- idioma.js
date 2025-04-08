import { franc } from 'franc-min';
import nspell from 'nspell';
import dictionaryEs from 'dictionary-es';
import dictionaryEn from 'dictionary-en';
import readline from 'readline';

// Cargar diccionarios de español e inglés
const loadDictionaries = async () => {
  const dictEs = await dictionaryEs; // Sin invocar como función
  const dictEn = await dictionaryEn; // Sin invocar como función
  return {
    spanish: nspell(dictEs),
    english: nspell(dictEn),
  };
};

// Función para detectar el idioma
const detectLanguage = (text, dictionaries) => {
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

  return language;
};

// Crear interfaz de entrada/salida para la terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Escribe una palabra o frase para detectar el idioma: '
});

// Iniciar sistema
loadDictionaries().then((dictionaries) => {
  console.log('Sistema de detección de idioma iniciado.');
  rl.prompt();

  // Manejar entrada del usuario
  rl.on('line', (input) => {
    const text = input.trim();
    if (text === 'salir') {
      console.log('Saliendo del sistema...');
      rl.close();
      process.exit(0);
    }

    const language = detectLanguage(text, dictionaries);
    console.log(`El idioma detectado es: ${language}`);

    rl.prompt(); // Volver a mostrar el prompt
  });
}).catch((err) => {
  console.error('Error cargando los diccionarios:', err);
  process.exit(1);
});
