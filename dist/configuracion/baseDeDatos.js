import mysql from "mysql2/promise";
const configuracionBaseDeDatos = {
    host: "192.200.100.40",
    user: "SANMARINO",
    password: "sanmarino2021*",
    database: "kdramas_db",
    port: 3306
};
export const grupoDeConexiones = mysql.createPool(configuracionBaseDeDatos);
