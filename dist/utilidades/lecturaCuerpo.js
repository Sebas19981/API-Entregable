export function leerCuerpoDePeticion(peticion) {
    return new Promise(function (resolver, rechazar) {
        let cuerpoAcumulado = "";
        peticion.on("data", function (fragmentoDeDatos) {
            cuerpoAcumulado = cuerpoAcumulado + fragmentoDeDatos.toString();
        });
        peticion.on("end", function () {
            resolver(cuerpoAcumulado);
        });
        peticion.on("error", function (errorDeLectura) {
            rechazar(errorDeLectura);
        });
    });
}
