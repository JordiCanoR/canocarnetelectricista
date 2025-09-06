let tiempo = 40 * 60;
const tiempoSpan = document.getElementById("tiempo");
const testForm = document.getElementById("testForm");
let preguntas = [];
let seleccionadas = [];

// === Control de no repetición entre tests ===
const TEST_SIZE = 30;
let ordenBarajado = [];   // array de índices 0..N-1 barajado
let puntero = 0;          // próxima posición en el orden barajado
let preguntasUsadas = new Set(); // ← Para evitar repeticiones entre tests

// === Persistencia ===
const STORAGE_KEY = "test_estado_v1";
function guardarEstado(sig) {
    try {
        const payload = {
            sig,
            ordenBarajado,
            puntero,
            testSize: TEST_SIZE
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn("No se pudo guardar estado:", e);
    }
}

function cargarEstado(sig, totalPreguntas) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (
            data &&
            data.sig === sig &&
            Array.isArray(data.ordenBarajado) &&
            data.ordenBarajado.length === totalPreguntas &&
            Number.isInteger(data.puntero)
        ) {
            const valid = data.ordenBarajado.every(i =>
                Number.isInteger(i) && i >= 0 && i < totalPreguntas
            );
            if (!valid) return false;

            ordenBarajado = data.ordenBarajado.slice();
            puntero = Math.max(0, Math.min(data.puntero, totalPreguntas));
            return true;
        }
    } catch (e) {
        console.warn("No se pudo cargar estado:", e);
    }
    return false;
}

// Firma del banco para invalidar estado si cambian preguntas (N o enunciados)
function firmaBanco(pregs) {
    const claves = pregs.map(p => normalizar(p?.pregunta || ""));
    claves.sort();
    return `${claves.length}|` + claves.join("|");
}

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
    const disponibles = ordenBarajado.filter(i => !preguntasUsadas.has(i));
    const lote = [];

    // Si no hay suficientes disponibles, reinicia el set (pero NO el orden barajado)
    if (disponibles.length < size) {
        preguntasUsadas.clear();
        disponibles.push(...ordenBarajado);
    }

    let count = 0;
    for (let i = 0; i < disponibles.length && count < size; i++) {
        const idx = disponibles[i];
        if (!preguntasUsadas.has(idx)) {
            lote.push(idx);
            preguntasUsadas.add(idx);
            count++;
        }
    }

    return lote;
}

function generarTest() {
    testForm.innerHTML = "";
    document.getElementById("resultado").innerHTML = "";

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
        document.getElementById("resultado").innerHTML = "No hay preguntas disponibles.";
        return;
    }

    const tamano = Math.min(TEST_SIZE, preguntas.length);

    const disponibles = ordenBarajado.filter(i => !preguntasUsadas.has(i));
    if (disponibles.length < tamano) {
        document.getElementById("resultado").innerHTML =
            `<div class="mensaje-final" style="background: #fff3cd; border: 1px solid #ffeeba; padding: 10px; border-radius: 8px; color: #856404;">
                ⚠️ <strong>Has respondido todas las preguntas disponibles.</strong><br>
                El banco se reiniciará para seguir generando nuevos tests.
            </div><br>`;
    }

    const indices = generarLoteIndices(tamano);
    seleccionadas = indices.map(idx => preguntas[idx]);

    // Render
    seleccionadas.forEach((pregunta, i) => {
        const div = document.createElement("div");
        div.classList.add("pregunta");
        const opciones = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];
        const opcionesHTML = opciones.map(op =>
            `<label><input type="radio" name="q${i + 1}" value="${op}"> ${op}</label><br>`
        ).join("");
        div.innerHTML = `<p><strong>${i + 1}. ${pregunta.pregunta}</strong></p>` +
            (opciones.length ? opcionesHTML : `<em>Pregunta sin opciones válidas (revisar banco)</em>`);
        testForm.appendChild(div);
    });

    // Guardar estado
    try {
        const sig = firmaBanco(preguntas);
        guardarEstado(sig);
    } catch (e) {
        console.warn("No se pudo guardar el estado tras generar el test:", e);
    }
}

function normalizar(texto) {
    return (texto ?? "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarOpciones(opciones) {
    if (Array.isArray(opciones)) {
        return [...new Set(opciones.map(o => String(o ?? "").trim()))].filter(Boolean);
    }
    const s = String(opciones ?? "").trim();
    if (!s) return [];
    const trozos = s.split(/[\|\;\,\n\r]+/).map(t => t.trim()).filter(Boolean);
    return [...new Set(trozos)];
}

function prepararPregunta(p) {
    const copia = { ...p };
    const ops = normalizarOpciones(copia.opciones);
    const resp = String(copia.respuesta ?? "").trim();

    if (resp && ops.length && !ops.includes(resp)) {
        ops.push(resp);
    }
    if (!resp || ops.length < 2) {
        return null;
    }
    barajarArray(ops);

    copia.opciones = ops;
    copia.respuesta = resp;
    return copia;
}

function inyectarEstilosResultado() {
    const css = `
        #resultado {
            color: #111 !important;
            background: transparent;
            font-weight: bold;
        }
        #resultado .totales {
            color: #111 !important;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 12px;
            line-height: 1.4;
            font-weight: bold;
        }
        #resultado .mensaje-final {
            color: #111 !important;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            font-weight: bold;
        }
        #resultado details summary {
            cursor: pointer;
        }
    `;
    const tag = document.createElement("style");
    tag.setAttribute("data-inyectado", "resultado-visible");
    tag.appendChild(document.createTextNode(css));
    document.head.appendChild(tag);
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
    const noRespondidas = total - correctas - incorrectas;
    const pct = (n) => total ? (100 * n / total).toFixed(1) : "0.0";

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
        `<div class="totales">
            <strong>Totales</strong><br>
            ✅ Correctas: <strong>${correctas}</strong> (${pct(correctas)}%)<br>
            ❌ Incorrectas: <strong>${incorrectas}</strong> (${pct(incorrectas)}%)<br>
            ⏸️ No respondidas: <strong>${noRespondidas}</strong> (${pct(noRespondidas)}%)
        </div><br>` +
        `Has acertado ${correctas} de ${total} preguntas, fallado ${incorrectas}, sin responder ${noRespondidas}.<br>` +
        `Puntuación: ${puntos} / ${Math.min(TEST_SIZE, preguntas.length)}<br><br>` +
        `<div class='mensaje-final ${clase}'>${mensajeFinal}</div><br>` +
        `<details><summary>Ver detalles de respuestas falladas</summary><ul>${detallesFallos}</ul></details>`;
}

// Carga de preguntas e inicialización
fetch("preguntas_rebt_base.json")
    .then(res => res.json())
    .then(data => {
        const listaOriginal = Array.isArray(data) ? data : [];

        // Deduplicar
        const mapa = new Map();
        for (const p of listaOriginal) {
            const clave = normalizar(p?.pregunta || "");
            if (!mapa.has(clave)) {
                mapa.set(clave, p);
            }
        }
        const sinDuplicados = Array.from(mapa.values());

        const preparadas = sinDuplicados.map(prepararPregunta).filter(Boolean);

        console.log(`Original: ${listaOriginal.length} | Únicas: ${sinDuplicados.length} | Válidas: ${preparadas.length}`);

        preguntas = preparadas;

        const sig = firmaBanco(preguntas);
        const restaurado = cargarEstado(sig, preguntas.length);
        if (!restaurado) {
            inicializarOrden();
            guardarEstado(sig);
        }

        inyectarEstilosResultado();
        generarTest();
        temporizador();
    });

document.getElementById("btnCorregir").addEventListener("click", corregirTest);
document.getElementById("btnNuevo").addEventListener("click", () => {
    tiempo = 40 * 60;
    document.getElementById("resultado").innerHTML = "";
    generarTest();
});
