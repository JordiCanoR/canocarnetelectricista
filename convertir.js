// convertir.js
const fs = require('fs');
const path = require('path');

// 1. Ruta a tu JSON dentro de test_dinamico
const jsonPath = path.join(__dirname, 'test_dinamico', 'preguntas_rebt_base.json');

// 2. Lee el JSON
const raw = fs.readFileSync(jsonPath, 'utf-8');
const preguntas = JSON.parse(raw);

// 3. Función para extraer el ITC de la pregunta
function extraerITC(texto) {
  const m = texto.match(/\((ITC-[A-Z0-9\-]+)\)/);
  return m ? m[1] : '';
}

// 4. Cabecera del CSV
const columnas = [
  'id',
  'pregunta',
  'itc',
  'opcion_1',
  'opcion_2',
  'opcion_3',
  'respuesta_correcta'
];

// 5. Construye las filas, asegurando 3 opciones
const filas = preguntas.map((item, idx) => {
  // Desestructuramos con valores por defecto
  const [o1 = '', o2 = '', o3 = ''] = item.opciones || [];
  // Y la respuesta (también comprobamos que exista)
  const resp = item.respuesta ?? '';

  // Función interna para escapar comillas
  const esc = str => `"${String(str).replace(/"/g, '""')}"`;

  return [
    idx + 1,
    esc(item.pregunta),
    extraerITC(item.pregunta),
    esc(o1),
    esc(o2),
    esc(o3),
    esc(resp)
  ].join(',');
});

// 6. Escribe el CSV en la raíz del proyecto
const csv = [columnas.join(','), ...filas].join('\r\n');
fs.writeFileSync(path.join(__dirname, 'preguntas_electricista.csv'), csv, 'utf-8');

console.log('✅ preguntas_electricista.csv generado');
