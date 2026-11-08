import * as http from "http";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { grupoDeConexiones } from "../configuracion/baseDeDatos.js";
import { enviarRespuestaJson } from "../utilidades/respuestas.js";
import { leerCuerpoDePeticion } from "../utilidades/lecturaCuerpo.js";

const campos = ["titulo", "genero", "protagonista", "anio", "episodios", "calificacion"] as const;
type CampoKdrama = typeof campos[number];
interface DatosKdrama {
    titulo: string;
    genero: string;
    protagonista: string;
    anio: number;
    episodios: number;
    calificacion: number;
}
type FilaKdrama = RowDataPacket & { id: number } & DatosKdrama;

function validarDatos(datos: unknown, completos: boolean): datos is Partial<DatosKdrama> {
    if (datos === null || typeof datos !== "object" || Array.isArray(datos)) {
        return false;
    }

    const objeto = datos as Record<string, unknown>;
    const camposPermitidos = new Set<string>(campos);
    if (Object.keys(objeto).some((campo) => !camposPermitidos.has(campo))) {
        return false;
    }

    if (completos && campos.some((campo) => objeto[campo] === undefined)) {
        return false;
    }

    if (!completos && Object.keys(objeto).length === 0) {
        return false;
    }

    for (const campo of campos) {
        const valor = objeto[campo];
        if (valor === undefined) {
            continue;
        }

        if (campo === "titulo" || campo === "genero" || campo === "protagonista") {
            const maximo = campo === "genero" ? 80 : 150;
            if (typeof valor !== "string" || valor.trim().length === 0 || valor.length > maximo) {
                return false;
            }
        } else if (typeof valor !== "number" || !Number.isFinite(valor)) {
            return false;
        } else if (campo === "calificacion") {
            if (valor < 0 || valor > 10 || !Number.isInteger(valor * 10)) {
                return false;
            }
        } else if (!Number.isInteger(valor) || valor < 1 || valor > 2147483647) {
            return false;
        }
    }

    return true;
}

async function leerJson(peticion: http.IncomingMessage): Promise<unknown> {
    const cuerpo = await leerCuerpoDePeticion(peticion);
    return JSON.parse(cuerpo) as unknown;
}

async function obtenerPorId(id: number): Promise<FilaKdrama | undefined> {
    const [filas] = await grupoDeConexiones.execute<FilaKdrama[]>(
        "SELECT id, titulo, genero, protagonista, anio, episodios, calificacion FROM kdramas WHERE id = ?",
        [id]
    );
    return filas[0];
}

function responderIdInvalido(respuesta: http.ServerResponse): void {
    enviarRespuestaJson(respuesta, 400, { mensaje: "El id debe ser un numero entero positivo" });
}

function obtenerId(ruta: string): number | null {
    const coincidencia = ruta.match(/^\/kdramas\/(\d+)\/?$/);
    if (!coincidencia) {
        return null;
    }
    const id = Number(coincidencia[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function manejarKdramas(
    ruta: string,
    metodo: string,
    peticion: http.IncomingMessage,
    respuesta: http.ServerResponse
): Promise<void> {
    const rutaColeccion = ruta === "/kdramas" || ruta === "/kdramas/";
    const rutaItem = /^\/kdramas\/[^/]+\/?$/.test(ruta);

    if (!rutaColeccion && !rutaItem) {
        enviarRespuestaJson(respuesta, 404, { mensaje: "Ruta no encontrada" });
        return;
    }

    if (rutaColeccion && metodo === "GET") {
        const [filas] = await grupoDeConexiones.execute<FilaKdrama[]>(
            "SELECT id, titulo, genero, protagonista, anio, episodios, calificacion FROM kdramas ORDER BY id"
        );
        enviarRespuestaJson(respuesta, 200, filas);
        return;
    }

    if (rutaColeccion && metodo === "POST") {
        let datos: unknown;
        try {
            datos = await leerJson(peticion);
        } catch {
            enviarRespuestaJson(respuesta, 400, { mensaje: "El cuerpo debe contener JSON valido" });
            return;
        }

        if (!validarDatos(datos, false) ||
            datos.titulo === undefined || datos.genero === undefined ||
            datos.protagonista === undefined || datos.anio === undefined ||
            datos.episodios === undefined) {
            enviarRespuestaJson(respuesta, 400, {
                mensaje: "Envia titulo, genero, protagonista, anio y episodios; calificacion es opcional"
            });
            return;
        }

        const valores: [string, string, string, number, number, number] = [
            datos.titulo,
            datos.genero,
            datos.protagonista,
            datos.anio,
            datos.episodios,
            datos.calificacion ?? 0
        ];
        const [resultado] = await grupoDeConexiones.execute<ResultSetHeader>(
            "INSERT INTO kdramas (titulo, genero, protagonista, anio, episodios, calificacion) VALUES (?, ?, ?, ?, ?, ?)",
            valores
        );
        enviarRespuestaJson(respuesta, 201, await obtenerPorId(resultado.insertId));
        return;
    }

    if (rutaItem) {
        const id = obtenerId(ruta);
        if (id === null) {
            responderIdInvalido(respuesta);
            return;
        }

        if (metodo === "GET") {
            const kdrama = await obtenerPorId(id);
            if (!kdrama) {
                enviarRespuestaJson(respuesta, 404, { mensaje: "K-drama no encontrado" });
            } else {
                enviarRespuestaJson(respuesta, 200, kdrama);
            }
            return;
        }

        if (metodo === "PUT" || metodo === "PATCH") {
            let datos: unknown;
            try {
                datos = await leerJson(peticion);
            } catch {
                enviarRespuestaJson(respuesta, 400, { mensaje: "El cuerpo debe contener JSON valido" });
                return;
            }

            if (!validarDatos(datos, metodo === "PUT")) {
                enviarRespuestaJson(respuesta, 400, {
                    mensaje: metodo === "PUT"
                        ? "PUT requiere los seis campos validos de la tabla"
                        : "PATCH requiere al menos un campo valido de la tabla"
                });
                return;
            }

            const camposActualizados: CampoKdrama[] = [];
            const valores: (string | number)[] = [];
            for (const campo of campos) {
                if (datos[campo] !== undefined) {
                    camposActualizados.push(campo);
                    valores.push(datos[campo]);
                }
            }
            const asignaciones = camposActualizados.map((campo) => `${campo} = ?`).join(", ");
            valores.push(id);

            await grupoDeConexiones.execute(
                `UPDATE kdramas SET ${asignaciones} WHERE id = ?`,
                valores
            );
            const kdramaActualizado = await obtenerPorId(id);
            if (!kdramaActualizado) {
                enviarRespuestaJson(respuesta, 404, { mensaje: "K-drama no encontrado" });
            } else {
                enviarRespuestaJson(respuesta, 200, kdramaActualizado);
            }
            return;
        }

        if (metodo === "DELETE") {
            const [resultado] = await grupoDeConexiones.execute<ResultSetHeader>(
                "DELETE FROM kdramas WHERE id = ?",
                [id]
            );
            if (resultado.affectedRows === 0) {
                enviarRespuestaJson(respuesta, 404, { mensaje: "K-drama no encontrado" });
            } else {
                enviarRespuestaJson(respuesta, 200, { mensaje: "K-drama eliminado" });
            }
            return;
        }
    }

    respuesta.setHeader("Allow", rutaColeccion ? "GET, POST" : "GET, PUT, PATCH, DELETE");
    enviarRespuestaJson(respuesta, 405, { mensaje: "Metodo no permitido para esta ruta" });
}
