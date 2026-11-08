import { Pool } from "pg";
export const grupoDeConexiones = new Pool({
    host: process.env.PGHOST || "localhost",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "kdramas_db",
    port: Number(process.env.PGPORT || 5432)
});
