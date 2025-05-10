let tiempo = 40 * 60;
const tiempoSpan = document.getElementById("tiempo");
const testForm = document.getElementById("testForm");
let preguntas = [];
let seleccionadas = [];

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
function generarTest() {
    testForm.innerHTML = "";

    // Copia y baraja usando Fisher-Yates
    let copiaPreguntas = [...preguntas];
    for (let i = copiaPreguntas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copiaPreguntas[i], copiaPreguntas[j]] = [copiaPreguntas[j], copiaPreguntas[i]];
    }

    // Selecciona las primeras 30
    seleccionadas = copiaPreguntas.slice(0, 30);

    seleccionadas.forEach((pregunta, i) => {
        const div = document.createElement("div");
        div.classList.add("pregunta");
        div.innerHTML = `<p><strong>${i + 1}. ${pregunta.pregunta}</strong></p>` +
            pregunta.opciones.map(op =>
                `<label><input type="radio" name="q${i + 1}" value="${op}"> ${op}</label><br>`
            ).join("");
        testForm.appendChild(div);
    });
}


function normalizar(texto) {
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

function corregirTest() {
    let correctas = 0;
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
    const puntos = (correctas * 0.3).toFixed(2);
    let mensajeFinal = "", clase = "";

    if (puntos >= 8.1) {
        mensajeFinal = "✅ ¡Excelente! Has aprobado con nota.";
        clase = "aprobado";
    } else if (puntos >= 5) {
        mensajeFinal = "✅ ¡Bien hecho! Has aprobado.";
        clase = "aprobado";
    } else {
        mensajeFinal = "❌ Necesitas repasar. ¡Ánimo, la próxima lo consigues!";
        clase = "suspendido";
    }

    document.getElementById("resultado").innerHTML =
        `Has acertado ${correctas} de ${total} preguntas. Puntuación: ${puntos} / 9<br><br>` +
        `<div class='mensaje-final ${clase}'>${mensajeFinal}</div><br>` +
        `<details><summary>Ver detalles de respuestas falladas</summary><ul>${detallesFallos}</ul></details>`;
}

fetch("preguntas_rebt_base.json")
    .then(res => res.json())
    .then(data => {
        preguntas = data;
        generarTest();
        temporizador();
    });

document.getElementById("btnCorregir").addEventListener("click", corregirTest);
document.getElementById("btnNuevo").addEventListener("click", () => {
    tiempo = 40 * 60;
    document.getElementById("resultado").innerHTML = "";
    generarTest();
});
