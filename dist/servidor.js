import * as http from "http";
import { readFile } from "fs/promises";
import * as path from "path";
import * as url from "url";
import { manejarKdramas } from "./controladores/kdramas.js";
import { enviarRespuestaJson } from "./utilidades/respuestas.js";
const archivosEstaticos = {
    "/": { archivo: path.join(process.cwd(), "public", "index.html"), tipo: "text/html; charset=utf-8" },
    "/styles.css": { archivo: path.join(process.cwd(), "public", "styles.css"), tipo: "text/css; charset=utf-8" },
    "/app.js": { archivo: path.join(process.cwd(), "public", "app.js"), tipo: "text/javascript; charset=utf-8" },
    "/postman.md": { archivo: path.join(process.cwd(), "postman.md"), tipo: "text/markdown; charset=utf-8" }
};
async function servirInterfaz(ruta, metodo, respuesta) {
    const recurso = archivosEstaticos[ruta];
    if (!recurso) {
        return false;
    }
    if (metodo !== "GET" && metodo !== "HEAD") {
        respuesta.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
        respuesta.end("Metodo no permitido");
        return true;
    }
    const contenido = await readFile(recurso.archivo);
    respuesta.writeHead(200, {
        "Content-Type": recurso.tipo,
        "Content-Length": contenido.length
    });
    respuesta.end(metodo === "HEAD" ? undefined : contenido);
    return true;
}
const servidor = http.createServer(async function (peticion, respuesta) {
    const rutaActual = url.parse(peticion.url || "").pathname || "";
    const metodoActual = (peticion.method || "").toUpperCase();
    console.log(`Peticion: ${metodoActual} ${rutaActual}`);
    try {
        if (await servirInterfaz(rutaActual, metodoActual, respuesta)) {
            return;
        }
        await manejarKdramas(rutaActual, metodoActual, peticion, respuesta);
    }
    catch (error) {
        console.error("Error inesperado en la API:", error);
        if (!respuesta.headersSent) {
            enviarRespuestaJson(respuesta, 500, { mensaje: "Error interno del servidor" });
        }
        else {
            respuesta.end();
        }
    }
});
const puerto = Number(process.env.PORT || 3000);
servidor.listen(puerto, function () {
    console.log(`API de K-dramas escuchando en http://localhost:${puerto}`);
});
