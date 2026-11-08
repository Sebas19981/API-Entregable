const apiBase = "";
const dialog = document.querySelector("#request-dialog");
const form = document.querySelector("#request-form");
const sendButton = document.querySelector("#send-request");
const inputUrlSolicitud = document.querySelector("#request-url");
const panelCuerpoSolicitud = document.querySelector("#request-body-panel");
const entradaCuerpoSolicitud = document.querySelector("#request-body");
const ayudaCuerpoSolicitud = document.querySelector("#request-help");
const errorSolicitud = document.querySelector("#request-error");
const dramaList = document.querySelector("#drama-list");
const responseBody = document.querySelector("#response-body code");
const responseStatus = document.querySelector("#response-status");
const responseRequest = document.querySelector("#response-request");
const responseTime = document.querySelector("#response-time");
const docsDialog = document.querySelector("#docs-dialog");
const docsContent = document.querySelector("#docs-content");

const definicionesCuerpo = [
  { name: "titulo", tipo: "texto", obligatorio: true },
  { name: "genero", tipo: "texto", obligatorio: true },
  { name: "protagonista", tipo: "texto", obligatorio: true },
  { name: "anio", tipo: "numero", obligatorio: true },
  { name: "episodios", tipo: "numero", obligatorio: true },
  { name: "calificacion", tipo: "numero", obligatorio: false }
];

const operations = {
  GET: { title: "Consultar colección", description: "Lista todos los K-dramas o busca un registro por su ID." },
  POST: { title: "Crear K-drama", description: "Completa los datos para agregar un nuevo título a la colección." },
  PUT: { title: "Reemplazar K-drama", description: "Reemplaza todos los campos del registro seleccionado." },
  PATCH: { title: "Actualizar campos", description: "Modifica uno o varios campos del registro seleccionado." },
  DELETE: { title: "Eliminar K-drama", description: "Confirma el ID del registro que quieres eliminar." }
};

let activeMethod = "GET";

function agregarTextoEnLinea(wrapper, text) {
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let start = 0;
  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > start) wrapper.append(document.createTextNode(text.slice(start, match.index)));
    const token = match[0];
    let item;
    if (token.startsWith("**")) {
      item = document.createElement("strong");
      item.textContent = token.slice(2, -2);
    } else if (token.startsWith("`")) {
      item = document.createElement("code");
      item.textContent = token.slice(1, -1);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      item = document.createElement("a");
      item.textContent = linkMatch[1];
      item.href = linkMatch[2];
      item.target = "_blank";
      item.rel = "noreferrer";
    }
    wrapper.append(item);
    start = match.index + token.length;
  }
  if (start < text.length) wrapper.append(document.createTextNode(text.slice(start)));
}

function mostrarMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const fragment = document.createDocumentFragment();
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      fragment.append(pre);
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const item = document.createElement(`h${Math.min(heading[1].length + 1, 6)}`);
      agregarTextoEnLinea(item, heading[2]);
      fragment.append(item);
      index += 1;
      continue;
    }
    if (line.includes("|") && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[index + 1])) {
      const tableLines = [line];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const table = document.createElement("table");
      tableLines.forEach((tableLine, rowIndex) => {
        const values = tableLine.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((value) => value.trim());
        const row = document.createElement("tr");
        values.forEach((value) => {
          const cell = document.createElement(rowIndex === 0 ? "th" : "td");
          agregarTextoEnLinea(cell, value);
          row.append(cell);
        });
        if (rowIndex === 0) {
          const thead = document.createElement("thead");
          thead.append(row);
          table.append(thead);
        } else {
          if (!table.tBodies.length) table.createTBody();
          table.tBodies[0].append(row);
        }
      });
      fragment.append(table);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const list = document.createElement("ul");
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const item = document.createElement("li");
        agregarTextoEnLinea(item, lines[index].replace(/^\s*[-*]\s+/, ""));
        list.append(item);
        index += 1;
      }
      fragment.append(list);
      continue;
    }
    const paragraph = document.createElement("p");
    agregarTextoEnLinea(paragraph, line);
    fragment.append(paragraph);
    index += 1;
  }
  docsContent.replaceChildren(fragment);
}

async function abrirGuiaPostman() {
  docsDialog.showModal();
  docsContent.replaceChildren(Object.assign(document.createElement("p"), { textContent: "Cargando guía..." }));
  try {
    const response = await fetch("/postman.md");
    if (!response.ok) throw new Error(`El servidor respondió con HTTP ${response.status}.`);
    mostrarMarkdown(await response.text());
  } catch (error) {
    docsContent.replaceChildren(Object.assign(document.createElement("p"), {
      textContent: `No se pudo cargar postman.md. ${error instanceof Error ? error.message : String(error)}`
    }));
  }
}

function crearPlantillaJson(datosIniciales) {
  const cuerpo = Object.fromEntries(definicionesCuerpo.map(({ name }) => [name, datosIniciales?.[name] ?? ""]));
  return JSON.stringify(cuerpo, null, 2);
}

function construirFormularioOperacion(method, datosIniciales) {
  document.querySelector("#dialog-method").textContent = method;
  document.querySelector("#dialog-title").textContent = operations[method].title;
  document.querySelector("#dialog-description").textContent = operations[method].description;
  inputUrlSolicitud.value = method === "PUT" || method === "PATCH" || method === "DELETE"
    ? `/kdramas/${datosIniciales?.id ?? 1}`
    : "/kdramas";
  panelCuerpoSolicitud.hidden = method === "GET" || method === "DELETE";
  entradaCuerpoSolicitud.value = panelCuerpoSolicitud.hidden ? "" : crearPlantillaJson(datosIniciales);
  ayudaCuerpoSolicitud.textContent = method === "PATCH"
    ? "Deja como cadena vacía los campos que no quieras modificar."
    : method === "POST"
      ? "Completa los valores entre comillas. Calificación es opcional; déjala vacía para usar 0."
      : "Completa los seis campos. Los valores numéricos se convertirán automáticamente.";
  errorSolicitud.hidden = true;
  errorSolicitud.textContent = "";
}

function abrirOperacion(method, datosIniciales) {
  activeMethod = method;
  construirFormularioOperacion(method, datosIniciales);
  dialog.showModal();
}

function mostrarRespuesta(method, path, status, body, elapsed) {
  responseStatus.textContent = `${status} ${status >= 200 && status < 300 ? "OK" : "ERROR"}`;
  responseStatus.className = `insignia-respuesta ${status >= 200 && status < 300 ? "exito" : "fallo"}`;
  responseRequest.textContent = `${method} ${path}`;
  responseTime.textContent = `${elapsed} ms`;
  responseBody.textContent = typeof body === "string" ? body : JSON.stringify(body, null, 2);
}

async function ejecutarSolicitud(method, path, body) {
  const started = performance.now();
  let response;
  let result;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      result = text;
    }
    mostrarRespuesta(method, path, response.status, result, Math.round(performance.now() - started));
    if (!response.ok) throw new Error(`La solicitud respondió con HTTP ${response.status}.`);
    return result;
  } catch (error) {
    if (!response) {
      const elapsed = Math.round(performance.now() - started);
      mostrarRespuesta(method, path, "SIN CONEXIÓN", {
        mensaje: "No fue posible conectar con la API. Comprueba que el servidor esté iniciado.",
        detalle: error instanceof Error ? error.message : String(error)
      }, elapsed);
      establecerConexion(false);
    }
    throw error;
  }
}

function establecerConexion(connected) {
  const label = document.querySelector("#connection-state");
  const status = document.querySelector("#service-status");
  const note = document.querySelector("#service-note");
  label.textContent = connected ? "En línea" : "Sin conexión";
  label.style.color = connected ? "var(--mint)" : "#f0929a";
  status.textContent = connected ? "En línea" : "Offline";
  status.style.color = connected ? "var(--mint)" : "#f0929a";
  note.textContent = connected ? "API respondiendo correctamente" : "No se pudo conectar con la API";
}

function crearCelda(text, className) {
  const cell = document.createElement("td");
  cell.textContent = text === null || text === undefined ? "—" : String(text);
  if (className) cell.className = className;
  return cell;
}

function mostrarKdramas(data) {
  dramaList.replaceChildren();
  if (!Array.isArray(data) || data.length === 0) {
    const row = document.createElement("tr");
    const cell = crearCelda("No hay registros para mostrar.", "estado-vacio");
    cell.colSpan = 7;
    row.append(cell);
    dramaList.append(row);
    document.querySelector("#total-count").textContent = "0";
    return;
  }
  document.querySelector("#total-count").textContent = String(data.length).padStart(2, "0");
  for (const drama of data) {
    const row = document.createElement("tr");
    row.append(
      crearCelda(drama.titulo),
      crearCelda(drama.genero),
      crearCelda(drama.protagonista),
      crearCelda(drama.anio),
      crearCelda(drama.episodios),
      crearCelda(`★ ${drama.calificacion}`, "calificacion")
    );
    const actionCell = document.createElement("td");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "accion-fila";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => abrirOperacion("PATCH", drama));
    actionCell.append(edit);
    row.append(actionCell);
    dramaList.append(row);
  }
}

async function actualizarColeccion() {
  try {
    const data = await ejecutarSolicitud("GET", "/kdramas");
    mostrarKdramas(data);
    establecerConexion(true);
  } catch {
    const row = document.createElement("tr");
    const cell = crearCelda("No se pudo cargar la colección. Revisa la conexión con la API.", "estado-vacio");
    cell.colSpan = 7;
    row.append(cell);
    dramaList.replaceChildren(row);
    document.querySelector("#total-count").textContent = "—";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorSolicitud.hidden = true;
  const path = inputUrlSolicitud.value.trim();
  const rutaValida = /^\/kdramas\/?$/.test(path) || /^\/kdramas\/\d+\/?$/.test(path);
  if (!rutaValida) {
    errorSolicitud.textContent = "Usa una ruta válida: /kdramas o /kdramas/ID.";
    errorSolicitud.hidden = false;
    return;
  }
  if (activeMethod === "POST" && !/^\/kdramas\/?$/.test(path)) {
    errorSolicitud.textContent = "POST debe usar la ruta /kdramas.";
    errorSolicitud.hidden = false;
    return;
  }
  if (["PUT", "PATCH", "DELETE"].includes(activeMethod) && !/^\/kdramas\/\d+\/?$/.test(path)) {
    errorSolicitud.textContent = `${activeMethod} debe incluir el ID en la ruta, por ejemplo /kdramas/1.`;
    errorSolicitud.hidden = false;
    return;
  }

  let body;
  if (panelCuerpoSolicitud.hidden === false) {
    let cuerpoIngresado;
    try {
      cuerpoIngresado = JSON.parse(entradaCuerpoSolicitud.value);
    } catch (error) {
      errorSolicitud.textContent = `El cuerpo no contiene JSON válido. ${error instanceof Error ? error.message : String(error)}`;
      errorSolicitud.hidden = false;
      return;
    }
    if (cuerpoIngresado === null || typeof cuerpoIngresado !== "object" || Array.isArray(cuerpoIngresado)) {
      errorSolicitud.textContent = "El cuerpo JSON debe ser un objeto con los campos del K-drama.";
      errorSolicitud.hidden = false;
      return;
    }

    const camposDesconocidos = Object.keys(cuerpoIngresado).filter(
      (campo) => !definicionesCuerpo.some((definicion) => definicion.name === campo)
    );
    if (camposDesconocidos.length) {
      errorSolicitud.textContent = `Campos no reconocidos: ${camposDesconocidos.join(", ")}.`;
      errorSolicitud.hidden = false;
      return;
    }

    body = {};
    for (const definicion of definicionesCuerpo) {
      const valor = cuerpoIngresado[definicion.name];
      if (valor === undefined || valor === "") {
        if (activeMethod === "PATCH") continue;
        if (definicion.obligatorio || activeMethod === "PUT") {
          errorSolicitud.textContent = `Completa el campo "${definicion.name}" antes de enviar.`;
          errorSolicitud.hidden = false;
          return;
        }
        continue;
      }
      if (definicion.tipo === "numero") {
        const numero = typeof valor === "number" ? valor : Number(valor);
        if (!Number.isFinite(numero)) {
          errorSolicitud.textContent = `El campo "${definicion.name}" debe contener un número válido.`;
          errorSolicitud.hidden = false;
          return;
        }
        body[definicion.name] = numero;
      } else {
        body[definicion.name] = valor;
      }
    }
    if (activeMethod === "PATCH" && Object.keys(body).length === 0) {
      errorSolicitud.textContent = "Completa al menos un campo para enviar PATCH.";
      errorSolicitud.hidden = false;
      return;
    }
  }

  sendButton.disabled = true;
  sendButton.textContent = "Enviando...";
  try {
    const result = await ejecutarSolicitud(activeMethod, path, body);
    dialog.close();
    if (activeMethod === "GET" && !/^\/kdramas\/?$/.test(path)) {
      if (result && !Array.isArray(result)) mostrarKdramas([result]);
    } else if (activeMethod !== "GET") {
      await actualizarColeccion();
    } else {
      mostrarKdramas(result);
    }
  } catch {
    // The response panel already displays the API or network error.
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = 'Enviar solicitud <span>→</span>';
  }
});

document.querySelectorAll(".boton-metodo").forEach((button) => {
  button.addEventListener("click", () => abrirOperacion(button.dataset.method));
});
document.querySelector("#refresh-button").addEventListener("click", actualizarColeccion);
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#open-docs").addEventListener("click", abrirGuiaPostman);
document.querySelector("#close-docs").addEventListener("click", () => docsDialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
docsDialog.addEventListener("click", (event) => {
  if (event.target === docsDialog) docsDialog.close();
});

actualizarColeccion();
