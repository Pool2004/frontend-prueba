/**
 * Comfandi NutriSalud - JavaScript Frontend Logic
 * Integra comunicación con API FastAPI en Python y persistencia en archivo de texto.
 */

// Base URL para comunicación con Backend FastAPI
// Si la aplicación está servida directamente por FastAPI en el puerto 8000, usamos window.location.origin/api.
// De lo contrario (servida por Live Server en puerto 5500, file://, etc.), apuntamos explícitamente a https://backendnutrisalud.onrender.com/api.
const API_BASE_URL = (window.location.port === "8000" || window.location.origin.includes(":8000"))
  ? `${window.location.origin}/api`
  : "https://backendnutrisalud.onrender.com";

/**
 * Parsea la respuesta HTTP de manera segura sin lanzar 'Unexpected end of JSON input'.
 */
async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    return { detail: text || `Respuesta no válida del servidor (HTTP ${response.status})` };
  }
}

// Contexto de Web Audio API para el Buzzer de Computación Física
let audioCtx = null;

document.addEventListener("DOMContentLoaded", () => {
  inicializarNavegacion();
  cargarEstadisticas();
  cargarEstudiantes();
  actualizarPreviewIMC();
});

/* --------------------------------------------------------------------------
   Navegación de Pestañas (Tabs)
   -------------------------------------------------------------------------- */
function inicializarNavegacion() {
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

  const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
  const targetTab = document.getElementById(tabId);

  if (targetBtn) targetBtn.classList.add("active");
  if (targetTab) targetTab.classList.add("active");

  if (tabId === "tab-dashboard") {
    cargarEstadisticas();
  } else if (tabId === "tab-directorio") {
    cargarEstudiantes();
  }
}

/* --------------------------------------------------------------------------
   Cálculo y Preview de IMC en Tiempo Real (Formulario)
   -------------------------------------------------------------------------- */
function actualizarPreviewIMC() {
  const pesoInput = parseFloat(document.getElementById("peso").value);
  const estaturaInput = parseFloat(document.getElementById("estatura").value);

  const previewImc = document.getElementById("preview-imc");
  const previewBadge = document.getElementById("preview-badge");
  const previewRecTitle = document.getElementById("preview-rec-title");
  const previewRecText = document.getElementById("preview-rec-text");
  const previewRecBox = document.getElementById("preview-rec-box");

  if (!pesoInput || !estaturaInput || pesoInput <= 0 || estaturaInput <= 0) {
    previewImc.innerText = "--.--";
    previewBadge.innerText = "Esperando datos";
    previewBadge.className = "imc-badge";
    previewRecTitle.innerText = "Alerta Educativa";
    previewRecText.innerText = "Ingrese peso (kg) y estatura (cm) para visualizar la evaluación inmediata.";
    previewRecBox.style.borderLeftColor = "var(--border-color)";
    return;
  }

  const estaturaM = estaturaInput / 100.0;
  const imc = (pesoInput / (estaturaM * estaturaM)).toFixed(2);
  previewImc.innerText = imc;

  let clasificacion = "";
  let badgeClass = "";
  let recomendacion = "";
  let borderColor = "";

  if (imc < 18.5) {
    clasificacion = "Bajo peso";
    badgeClass = "badge badge-yellow";
    borderColor = "var(--color-yellow)";
    recomendacion = "Promover el consumo de alimentos ricos en nutrientes (proteínas, frutas, cereales) y consultar al equipo escolar.";
  } else if (imc >= 18.5 && imc <= 24.9) {
    clasificacion = "Peso normal";
    badgeClass = "badge badge-green";
    borderColor = "var(--color-green)";
    recomendacion = "Mantener alimentación balanceada, hidratación (6-8 vasos de agua) y 60 min de actividad física diaria.";
  } else if (imc >= 25.0 && imc <= 29.9) {
    clasificacion = "Sobrepeso";
    badgeClass = "badge badge-orange";
    borderColor = "var(--color-orange)";
    recomendacion = "Reducir consumo de azúcares y bebidas azucaradas. Incrementar verdura y actividad deportiva en recreos.";
  } else {
    clasificacion = "Obesidad";
    badgeClass = "badge badge-red";
    borderColor = "var(--color-red)";
    recomendacion = "Acompañamiento pedagógico y nutricional especializado con pausas activas y hábitos estructurados.";
  }

  previewBadge.innerText = clasificacion;
  previewBadge.className = badgeClass;
  previewRecTitle.innerText = `Evaluación: ${clasificacion}`;
  previewRecText.innerText = recomendacion;
  previewRecBox.style.borderLeftColor = borderColor;
}

/* --------------------------------------------------------------------------
   Guardar Estudiante en Backend (FastAPI -> Archivo de texto)
   -------------------------------------------------------------------------- */
async function guardarEstudiante(event) {
  event.preventDefault();

  const documento = document.getElementById("documento").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const edad = parseInt(document.getElementById("edad").value);
  const grado = document.getElementById("grado").value;
  const genero = document.getElementById("genero").value;
  const peso = parseFloat(document.getElementById("peso").value);
  const estatura = parseFloat(document.getElementById("estatura").value);
  const observaciones = document.getElementById("observaciones").value.trim();

  const btnSubmit = document.getElementById("btn-submit-form");
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Guardando en Archivo de Texto...";

  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documento,
        nombre,
        edad,
        grado,
        genero,
        peso,
        estatura,
        observaciones
      })
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.detail || `Error al guardar registro (${response.status}).`);
    }

    alert(`Estudiante ${data.nombre || 'registrado'} con éxito.\nAlmacenado en: estudiantes.txt`);

    limpiarFormulario();
    cargarEstadisticas();
    switchTab("tab-directorio");
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = "Guardar Registro en Archivo de Texto";
  }
}

function limpiarFormulario() {
  document.getElementById("form-estudiante").reset();
  actualizarPreviewIMC();
}

/* --------------------------------------------------------------------------
   Cargar y Listar Estudiantes (Directorio)
   -------------------------------------------------------------------------- */
async function cargarEstudiantes() {
  const buscar = document.getElementById("input-buscar")?.value.trim() || "";
  const clasificacion = document.getElementById("filter-clasificacion")?.value || "";
  const grado = document.getElementById("filter-grado")?.value || "";

  const tbody = document.getElementById("tbody-estudiantes");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Cargando registros desde archivo de texto...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (buscar) params.append("buscar", buscar);
    if (clasificacion) params.append("clasificacion", clasificacion);
    if (grado) params.append("grado", grado);

    const response = await fetch(`${API_BASE_URL}/estudiantes?${params.toString()}`);
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.detail || "No se pudo obtener la lista de estudiantes.");

    const estudiantes = Array.isArray(data) ? data : [];

    if (estudiantes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron registros de estudiantes.</td></tr>`;
      return;
    }

    tbody.innerHTML = estudiantes.map(e => {
      let badgeClass = "badge-green";
      if (e.clasificacion === "Bajo peso") badgeClass = "badge-yellow";
      else if (e.clasificacion === "Sobrepeso") badgeClass = "badge-orange";
      else if (e.clasificacion === "Obesidad") badgeClass = "badge-red";

      let alertaBadge = "badge-green";
      if (e.nivel_alerta === "Preventiva") alertaBadge = "badge-yellow";
      else if (e.nivel_alerta === "Prioritaria") alertaBadge = "badge-red";

      return `
        <tr>
          <td><strong>${e.documento}</strong></td>
          <td>${e.nombre}</td>
          <td>${e.edad} años (${e.grado})</td>
          <td>${e.peso} kg / ${e.estatura} cm</td>
          <td><strong>${e.imc}</strong></td>
          <td><span class="badge ${badgeClass}">${e.clasificacion}</span></td>
          <td><span class="badge ${alertaBadge}">${e.nivel_alerta}</span></td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-secondary" onclick="verDetalleEstudiante(${e.id})">Detalles</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarEstudiante(${e.id}, '${e.nombre}')">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("Error al cargar estudiantes:", error);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-red);">Error al conectar con la API de almacenamiento. Verifique que el backend esté ejecutándose.</td></tr>`;
  }
}

/* --------------------------------------------------------------------------
   Cargar Estadísticas (Dashboard)
   -------------------------------------------------------------------------- */
async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_BASE_URL}/estadisticas`);
    const data = await parseJsonResponse(response);
    if (!response.ok) return;

    document.getElementById("stat-total").innerText = data.total_estudiantes;
    document.getElementById("stat-promedio-imc").innerText = data.promedio_imc;
    document.getElementById("stat-normal-count").innerText = data.distribucion["Peso normal"] || 0;
    document.getElementById("stat-atencion-pct").innerText = `${data.porcentaje_requiere_atencion}%`;

    const total = data.total_estudiantes || 1;
    const bajoPesoPct = Math.round(((data.distribucion["Bajo peso"] || 0) / total) * 100);
    const pesoNormalPct = Math.round(((data.distribucion["Peso normal"] || 0) / total) * 100);
    const sobrepesoPct = Math.round(((data.distribucion["Sobrepeso"] || 0) / total) * 100);
    const obesidadPct = Math.round(((data.distribucion["Obesidad"] || 0) / total) * 100);

    document.getElementById("count-bajo-peso").innerText = `${data.distribucion["Bajo peso"] || 0} (${bajoPesoPct}%)`;
    document.getElementById("bar-bajo-peso").style.width = `${bajoPesoPct}%`;

    document.getElementById("count-peso-normal").innerText = `${data.distribucion["Peso normal"] || 0} (${pesoNormalPct}%)`;
    document.getElementById("bar-peso-normal").style.width = `${pesoNormalPct}%`;

    document.getElementById("count-sobrepeso").innerText = `${data.distribucion["Sobrepeso"] || 0} (${sobrepesoPct}%)`;
    document.getElementById("bar-sobrepeso").style.width = `${sobrepesoPct}%`;

    document.getElementById("count-obesidad").innerText = `${data.distribucion["Obesidad"] || 0} (${obesidadPct}%)`;
    document.getElementById("bar-obesidad").style.width = `${obesidadPct}%`;

  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  }
}

/* --------------------------------------------------------------------------
   Ver Detalle y Eliminar Estudiante
   -------------------------------------------------------------------------- */
async function verDetalleEstudiante(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes/${id}`);
    const e = await parseJsonResponse(response);
    if (!response.ok) throw new Error(e.detail || "No se pudo obtener el detalle.");

    document.getElementById("modal-nombre").innerText = e.nombre;
    const content = document.getElementById("modal-body-content");

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: #f8fafc; padding: 1rem; border-radius: 8px;">
        <div><strong>Documento:</strong> ${e.documento}</div>
        <div><strong>Edad / Grado:</strong> ${e.edad} años (${e.grado})</div>
        <div><strong>Género:</strong> ${e.genero}</div>
        <div><strong>Fecha Registro:</strong> ${e.fecha_registro}</div>
        <div><strong>Peso:</strong> ${e.peso} kg</div>
        <div><strong>Estatura:</strong> ${e.estatura} cm</div>
        <div><strong>IMC:</strong> ${e.imc}</div>
        <div><strong>Clasificación:</strong> <span class="badge badge-info">${e.clasificacion}</span></div>
      </div>
      <div style="margin-top: 0.75rem;">
        <strong>Observaciones Registradas:</strong>
        <p style="color: var(--text-muted); font-size: 0.88rem; background: #ffffff; border: 1px solid var(--border-color); padding: 0.6rem; border-radius: 6px; margin-top: 0.25rem;">
          ${e.observaciones || "Sin observaciones particulares registrados."}
        </p>
      </div>
      <div style="margin-top: 0.75rem; background: var(--primary-light); padding: 0.85rem; border-radius: 8px; border-left: 4px solid var(--primary-color);">
        <strong style="color: var(--primary-color);">Recomendación Pedagógica Nutricional:</strong>
        <p style="color: var(--text-main); font-size: 0.85rem; margin-top: 0.25rem;">${e.recomendacion}</p>
      </div>
    `;

    document.getElementById("modal-detalle").classList.add("active");
  } catch (error) {
    alert(error.message);
  }
}

function cerrarModal() {
  document.getElementById("modal-detalle").classList.remove("active");
}

async function eliminarEstudiante(id, nombre) {
  if (!confirm(`¿Está seguro de eliminar el registro de ${nombre}?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes/${id}`, {
      method: "DELETE"
    });
    const data = await parseJsonResponse(response);

    if (!response.ok) throw new Error(data.detail || "Error al eliminar el estudiante.");

    alert("Registro eliminado correctamente del archivo de texto.");
    cargarEstudiantes();
    cargarEstadisticas();
  } catch (error) {
    alert(error.message);
  }
}



/* --------------------------------------------------------------------------
   Exportar Datos a CSV
   -------------------------------------------------------------------------- */
async function exportarCSV() {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes`);
    const estudiantes = await parseJsonResponse(response);

    if (!response.ok || !Array.isArray(estudiantes)) {
      throw new Error(estudiantes.detail || "No se pudo obtener los datos para exportar.");
    }

    if (estudiantes.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    const headers = ["ID", "Documento", "Nombre", "Edad", "Grado", "Genero", "Peso_kg", "Estatura_cm", "IMC", "Clasificacion", "Nivel_Alerta", "Fecha_Registro"];
    const rows = estudiantes.map(e => [
      e.id,
      `"${e.documento}"`,
      `"${e.nombre}"`,
      e.edad,
      `"${e.grado}"`,
      `"${e.genero}"`,
      e.peso,
      e.estatura,
      e.imc,
      `"${e.clasificacion}"`,
      `"${e.nivel_alerta}"`,
      `"${e.fecha_registro}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_nutricional_comfandi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    alert("Error al generar exportación CSV: " + error.message);
  }
}
