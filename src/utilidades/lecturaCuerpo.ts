import * as http from "http";

export function leerCuerpoDePeticion(peticion: http.IncomingMessage): Promise<string> {
    return new Promise(function (resolver: (valor: string) => void, rechazar: (razon: any) => void) {
        let cuerpoAcumulado: string = "";
        peticion.on("data", function (fragmentoDeDatos: Buffer) {
            cuerpoAcumulado = cuerpoAcumulado + fragmentoDeDatos.toString();
        });
        peticion.on("end", function () {
            resolver(cuerpoAcumulado);
        });
        peticion.on("error", function (errorDeLectura: Error) {
            rechazar(errorDeLectura);
        });
    });
}