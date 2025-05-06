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
    seleccionadas = preguntas.sort(() => 0.5 - Math.random()).slice(0, 30);
    seleccionadas.forEach((pregunta, i) => {
        const div = document.createElement("div");
        div.classList.add("pregunta");
        div.innerHTML = `<p><strong>${i + 1}. ${pregunta.pregunta}</strong></p>` +
            pregunta.opciones.map((op, idx) =>
                `<label><input type="radio" name="q${i + 1}" value="${String.fromCharCode(97 + idx)}"> ${op}</label><br>`
            ).join("");
        testForm.appendChild(div);
    });
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
        let correctaMostrada = false;
        let respondida = false;
        opciones.forEach((op, idx) => {
            if (op.checked) respondida = true;
            if (String.fromCharCode(97 + idx) === pregunta.respuesta) {
                if (seleccion && seleccion.value === op.value) {
                    correctas++;
                    op.closest("label").classList.add("correcta");
                } else {
                    if (!correctaMostrada) {
                        op.closest("label").classList.add("resaltada-correcta");
                        correctaMostrada = true;
                    }
                    if (seleccion && seleccion.value !== op.value) {
                        seleccion.closest("label").classList.add("incorrecta");
                    }
                    if (!respondida) {
                        detallesFallos += `<li>Pregunta ${i + 1}: No respondida. Respuesta correcta: <strong>${pregunta.respuesta.toUpperCase()}</strong></li>`;
                    } else {
                        detallesFallos += `<li>Pregunta ${i + 1}: Respondida con <strong>${seleccion.value.toUpperCase()}</strong>. Correcta: <strong>${pregunta.respuesta.toUpperCase()}</strong></li>`;
                    }
                }
            }
        });
    });
    let total = seleccionadas.length;
    let resultado = `Has acertado ${correctas} de ${total} preguntas. Puntuación: ${(correctas / total * 100).toFixed(2)}%<br><br>`;
    let mensajeFinal = "", clase = "";
    if ((correctas / total) >= 0.9) {
        mensajeFinal = "✅ ¡Excelente! Has aprobado con nota.";
        clase = "aprobado";
    } else if ((correctas / total) >= 0.6) {
        mensajeFinal = "✅ ¡Bien hecho! Has aprobado.";
        clase = "aprobado";
    } else {
        mensajeFinal = "❌ Necesitas repasar. ¡Ánimo, la próxima lo consigues!";
        clase = "suspendido";
    }
    document.getElementById("resultado").innerHTML =
        resultado +
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