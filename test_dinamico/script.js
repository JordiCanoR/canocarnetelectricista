let tiempo = 40 * 60;
const tiempoSpan = document.getElementById("tiempo");
const testForm = document.getElementById("testForm");
let preguntas = [];
let seleccionadas = [];

// === Control de no repetición entre tests ===
const TEST_SIZE = 30;
let ordenBarajado = [];   // array de índices 0..N-1 barajado
let puntero = 0;          // próxima posición en el orden barajado

function temporizador() {
    const timer = setInterval(() => {
        let minutos = Math.floor(tiempo / 60);
        let segundos = tiempo % 60;
        tiempoSpan.textContent = minutos.toString().padStart(2, '0') + ":" + segundos.toString().padStart(2, '0');
        if (tiempo <= 0) {
            clearInterval(timer);
            corregirTest();
        }
        tiempo--;
    }, 1000);
}

function barajarArray(arr) {
    // Fisher-Yates in-place
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function inicializarOrden() {
    ordenBarajado = Array.from({ length: preguntas.length }, (_, i) => i);
    barajarArray(ordenBarajado);
    puntero = 0;
}

function generarLoteIndices(size) {
    const n = preguntas.length;
    const lote = [];

    if (n === 0) return lote;

    // Si hay suficientes restantes en el ciclo actual, toma directo
    if (puntero + size <= n) {
        for (let k = 0; k < size; k++) {
            lote.push(ordenBarajado[puntero + k]);
        }
        puntero += size;
        // Si justo hemos llegado al final, preparamos un nuevo ciclo barajado para la próxima vez
        if (puntero === n) {
            inicializarOrden();
        }
        return lote;
    }

    // Si no hay suficientes, toma las que quedan, rebaraja todo el banco y completa
    const restantes = n - puntero;
    for (let k = 0; k < restantes; k++) {
        lote.push(ordenBarajado[puntero + k]);
    }

    // Reinicia ciclo (nuevo barajado) y toma el resto del tamaño requerido
    inicializarOrden();
    const faltan = size - restantes;
    for (let k = 0; k < faltan; k++) {
        lote.push(ordenBarajado[puntero + k]);
    }
    puntero += faltan;

    return lote;
}

function generarTest() {
    testForm.innerHTML = "";

    // Comprobaciones
    if (!Array.isArray(preguntas) || preguntas.length === 0) {
        document.getElementById("resultado").innerHTML = "No hay preguntas disponibles.";
        return;
    }

    // Si hay menos de 30 preguntas en total, avisamos y usamos todas (no se puede tener 30 únicas)
    const tamano = Math.min(TEST_SIZE, preguntas.length);
    if (preguntas.length < TEST_SIZE) {
        console.warn(`Solo hay ${preguntas.length} preguntas en el banco; se generará un test de ${tamano} sin repeticiones.`);
    }

    // Obtener índices para este test sin repetir hasta agotar el banco
    const indices = generarLoteIndices(tamano);

    // Construir 'seleccionadas'
    seleccionadas = indices.map(idx => preguntas[idx]);

    // Render
    seleccionadas.forEach((pregunta, i) => {
        const div = document.createElement("div");
        div.classList.add("pregunta");
        const opcionesHTML = (pregunta.opciones || []).map(op =>
            `<label><input type="radio" name="q${i + 1}" value="${op}"> ${op}</label><br>`
        ).join("");
        div.innerHTML = `<p><strong>${i + 1}. ${pregunta.pregunta}</strong></p>${opcionesHTML}`;
        testForm.appendChild(div);
    });
}

function normalizar(texto) {
    return (texto ?? "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function corregirTest() {
    let correctas = 0;
    let incorrectas = 0;
    let detallesFallos = "";

    seleccionadas.forEach((pregunta, i) => {
        const opciones = document.getElementsByName("q" + (i + 1));
        let seleccion = null;

        opciones.forEach(op => {
            op.closest("label").classList.remove("correcta", "incorrecta", "resaltada-correcta");
            if (op.checked) seleccion = op;
        });

        const respondida = !!seleccion;
        const respNormalizada = normalizar(pregunta.respuesta);

        opciones.forEach(op => {
            const opValNorm = normalizar(op.value);

            if (opValNorm === respNormalizada) {
                if (seleccion && normalizar(seleccion.value) === opValNorm) {
                    correctas++;
                    op.closest("label").classList.add("correcta");
                } else {
                    op.closest("label").classList.add("correcta");
                }
            }

            if (seleccion && seleccion.value === op.value && opValNorm !== respNormalizada) {
                incorrectas++;
                seleccion.closest("label").classList.add("incorrecta");
            }
        });

        if (!respondida) {
            detallesFallos += `<li>Pregunta ${i + 1}: No respondida. Respuesta correcta: <strong>${pregunta.respuesta}</strong></li>`;
        } else if (normalizar(seleccion.value) !== respNormalizada) {
            detallesFallos += `<li>Pregunta ${i + 1}: Respondida con <strong>${seleccion.value}</strong>. Correcta: <strong>${pregunta.respuesta}</strong></li>`;
        }
    });

    const total = seleccionadas.length;
    const puntos = (correctas * 1 - incorrectas * 0.3).toFixed(2);
    let mensajeFinal = "", clase = "";

    if (puntos >= 27) {
        mensajeFinal = "✅ ¡Excelente! Has sacado más del 90 %.";
        clase = "aprobado";
    } else if (puntos >= 15) {
        mensajeFinal = "✅ ¡Bien hecho! Has aprobado.";
        clase = "aprobado";
    } else {
        mensajeFinal = "❌ Necesitas repasar. ¡Ánimo, la próxima lo consigues!";
        clase = "suspendido";
    }

    document.getElementById("resultado").innerHTML =
        `Has acertado ${correctas} de ${total} preguntas, fallado ${incorrectas}, sin responder ${total - correctas - incorrectas}.<br>` +
        `Puntuación: ${puntos} / ${Math.min(TEST_SIZE, preguntas.length)}<br><br>` +
        `<div class='mensaje-final ${clase}'>${mensajeFinal}</div><br>` +
        `<details><summary>Ver detalles de respuestas falladas</summary><ul>${detallesFallos}</ul></details>`;
}

// Carga de preguntas e inicialización (con DEDUPLICACIÓN por enunciado)
fetch("preguntas_rebt_base.json")
    .then(res => res.json())
    .then(data => {
        // Asegurar array
        const listaOriginal = Array.isArray(data) ? data : [];

        // Eliminar duplicadas por campo 'pregunta' (normalizado)
        const mapa = new Map();
        for (const p of listaOriginal) {
            const clave = normalizar(p?.pregunta || "");
            if (!mapa.has(clave)) {
                mapa.set(clave, p); // conserva la primera aparición
            }
        }
        preguntas = Array.from(mapa.values());
        console.log(`Preguntas cargadas: ${preguntas.length} (duplicados eliminados si había)`);

        inicializarOrden();
        generarTest();
        temporizador();
    });

// Botones
document.getElementById("btnCorregir").addEventListener("click", corregirTest);
document.getElementById("btnNuevo").addEventListener("click", () => {
    tiempo = 40 * 60;
    document.getElementById("resultado").innerHTML = "";
    generarTest();
});
