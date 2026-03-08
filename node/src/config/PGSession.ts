import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { Pool } from 'pg';

export default function getPgSessionStoreInstance(): session.Store {
    const databaseUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=-c%20search_path=${process.env.DB_SCHEMA}`;
    const PgSessionStore = connectPgSimple(session);
    const sessionPool = new Pool({ connectionString: databaseUrl });

    return new PgSessionStore({
        pool: sessionPool,
        tableName: "user_session",
        createTableIfMissing: true
    });
}