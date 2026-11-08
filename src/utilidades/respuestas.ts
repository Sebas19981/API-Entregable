import * as http from "http";

export function enviarRespuestaJson(respuesta: http.ServerResponse, codigoEstado: number, datos: unknown): void {
    respuesta.writeHead(codigoEstado, { "Content-Type": "application/json; charset=utf-8" });
    respuesta.end(JSON.stringify(datos, null, 2));
}