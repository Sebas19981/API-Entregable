import mysql from "mysql2/promise";

function requerida(nombre: string): string {
    const valor = process.env[nombre];
    if (!valor) {
        throw new Error(`Falta la variable de entorno ${nombre}`);
    }
    return valor;
}

const configuracionBaseDeDatos = {
    host: requerida("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: requerida("DB_USER"),
    password: requerida("DB_PASSWORD"),
    database: requerida("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 15000
};

export const grupoDeConexiones = mysql.createPool(configuracionBaseDeDatos);
