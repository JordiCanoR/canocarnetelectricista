
document.addEventListener("DOMContentLoaded", () => {
    const testForm = document.getElementById("testForm");
    const resultadoDiv = document.getElementById("resultado");
    const nuevoTestBtn = document.getElementById("nuevoTest");

    let preguntas = [];
    let respuestasCorrectas = [];

    fetch("preguntas_rebt_base.json")
        .then(response => response.json())
        .then(data => {
            preguntas = data.sort(() => 0.5 - Math.random()).slice(0, 5);
            cargarPreguntas();
        });

    function cargarPreguntas() {
        testForm.innerHTML = "";
        respuestasCorrectas = [];
        preguntas.forEach((pregunta, index) => {
            const div = document.createElement("div");
            div.className = "pregunta";
            div.innerHTML = `<p><strong>${index + 1}. ${pregunta.pregunta}</strong></p>`;
            pregunta.opciones.forEach(opcion => {
                div.innerHTML += `<label><input type="radio" name="q${index}" value="${opcion}"> ${opcion}</label><br>`;
            });
            respuestasCorrectas.push(pregunta.respuesta);
            testForm.appendChild(div);
        });
        testForm.innerHTML += '<button type="submit">Enviar test</button>';
    }

    testForm.addEventListener("submit", (e) => {
        e.preventDefault();
        let correctas = 0;
        preguntas.forEach((pregunta, i) => {
            const respuestas = document.getElementsByName("q" + i);
            respuestas.forEach(r => {
                r.parentElement.classList.remove("correcta", "incorrecta");
                if (r.checked && r.value === respuestasCorrectas[i]) {
                    correctas++;
                    r.parentElement.classList.add("correcta");
                } else if (r.checked && r.value !== respuestasCorrectas[i]) {
                    r.parentElement.classList.add("incorrecta");
                }
                if (r.value === respuestasCorrectas[i]) {
                    r.parentElement.classList.add("resaltada-correcta");
                }
            });
        });
        const total = preguntas.length;
        const porcentaje = (correctas / total * 100).toFixed(2);
        const aprobado = porcentaje >= 60 ? "✅ Aprobado" : "❌ Suspendido";
        resultadoDiv.innerHTML = `<p>Has acertado ${correctas} de ${total} preguntas. (${porcentaje}%)</p><div class='mensaje-final'>${aprobado}</div>`;
    });

    nuevoTestBtn.addEventListener("click", () => {
        location.reload();
    });
});
