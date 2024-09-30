import pkg from 'pg';
const { Pool } = pkg;

// Configurer la connexion à PostgreSQL
export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dbchattechavance',
  password: '210902',
  port: 5432,
});


