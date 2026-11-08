export function enviarRespuestaJson(respuesta, codigoEstado, datos) {
    respuesta.writeHead(codigoEstado, { "Content-Type": "application/json; charset=utf-8" });
    respuesta.end(JSON.stringify(datos, null, 2));
}
