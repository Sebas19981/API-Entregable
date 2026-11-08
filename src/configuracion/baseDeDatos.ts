import { Pool } from "pg";

export const grupoDeConexiones = new Pool({
    host: process.env.PGHOST || "postgresql://sebas:M5kXLI5I1t415QmjCuvcXmdDMRZdP4xu@dpg-dbnt3mjl550s7384lbtg-a/k_drama_9iag",
    user: process.env.PGUSER || "sebas",
    password: process.env.PGPASSWORD || "M5kXLI5I1t415QmjCuvcXmdDMRZdP4xu",
    database: process.env.PGDATABASE || "k_drama_9iag",
    port: Number(process.env.PGPORT || 5432)
});

